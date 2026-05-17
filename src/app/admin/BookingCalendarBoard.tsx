"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { updateBookingStatus } from "@/app/actions/bookings";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import type { BookingStatus } from "@/lib/supabase/database.types";
import {
  BOOKING_EMPLOYEE_REQUIRED_MESSAGE,
  bookingFormEmployeeMissing,
} from "@/lib/booking-form-client";

export type CalendarBooking = {
  id: string;
  reference: string;
  customerName: string;
  activityName: string;
  instructorName: string;
  startTime: string | null;
  endTime: string | null;
  preferredDate: string;
  status: BookingStatus;
  employeeId: string | null;
  internalNotes: string | null;
  specialRequests: string | null;
};

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeLabel(value: string | null): string {
  if (!value) return "No preference";
  const [h, m] = value.split(":");
  if (!h || !m) return value;
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${m.slice(0, 2)} ${suffix}`;
}

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(":");
  if (!h || !m) return null;
  return Number(h) * 60 + Number(m);
}

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

export function BookingCalendarBoard({
  bookings,
  employees,
}: {
  bookings: CalendarBooking[];
  employees: Array<{
    id: string;
    name: string;
    employee_code: string;
    role: string;
  }>;
}) {
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(toDayKey(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast, hideLoading } = useAdminToast();

  const handleBookingSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (bookingFormEmployeeMissing(event.currentTarget)) {
      event.preventDefault();
      hideLoading();
      showToast({
        message: BOOKING_EMPLOYEE_REQUIRED_MESSAGE,
        variant: "error",
      });
    }
  };

  const bookingsByDay = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        const key = booking.preferredDate;
        if (!acc[key]) acc[key] = [];
        acc[key].push(booking);
        return acc;
      },
      {} as Record<string, CalendarBooking[]>,
    );
  }, [bookings]);

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = toDayKey(d);
      return {
        key,
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        count: bookingsByDay[key]?.length ?? 0,
      };
    });
  }, [monthCursor, bookingsByDay]);

  const selectedBookings = bookingsByDay[selectedDay] ?? [];

  useEffect(() => {
    setEditingId(null);
  }, [selectedDay]);

  useEffect(() => {
    const row = selectedBookings.find((x) => x.id === editingId);
    if (row?.status === "cancelled") setEditingId(null);
  }, [selectedBookings, editingId]);

  const conflictIds = useMemo(() => {
    const result = new Set<string>();
    const candidates = bookings
      .filter((b) => (b.status === "pending" || b.status === "confirmed") && b.employeeId)
      .map((b) => ({
        ...b,
        start: parseTimeToMinutes(b.startTime),
        end:
          parseTimeToMinutes(b.endTime) ??
          (parseTimeToMinutes(b.startTime) != null
            ? (parseTimeToMinutes(b.startTime) as number) + 60
            : null),
      }))
      .filter((b) => b.start != null && b.end != null);

    const grouped = new Map<string, typeof candidates>();
    for (const row of candidates) {
      const key = `${row.employeeId}|${row.preferredDate}`;
      const arr = grouped.get(key) ?? [];
      arr.push(row);
      grouped.set(key, arr);
    }

    grouped.forEach((rows) => {
      const sorted = [...rows].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
      for (let i = 0; i < sorted.length - 1; i++) {
        const left = sorted[i];
        const right = sorted[i + 1];
        if ((left.end ?? 0) > (right.start ?? Number.MAX_SAFE_INTEGER)) {
          result.add(left.id);
          result.add(right.id);
        }
      }
    });

    return result;
  }, [bookings]);
  const conflictDays = useMemo(() => {
    const days = new Set<string>();
    bookings.forEach((b) => {
      if (conflictIds.has(b.id)) days.add(b.preferredDate);
    });
    return days;
  }, [bookings, conflictIds]);
  const monthLabel = monthCursor.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="border border-base-content/10 p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">Booking calendar</h2>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
            }
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-40 text-center text-sm uppercase tracking-[0.18em]">
            {monthLabel}
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
            }
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.25em] text-base-content/60">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => (
          <button
            key={day.key}
            type="button"
            onClick={() => setSelectedDay(day.key)}
            className={`relative min-h-20 border p-2 text-left transition ${
              day.isCurrentMonth
                ? "border-base-content/10 bg-base-100"
                : "border-base-content/5 bg-base-200/40 text-base-content/40"
            } ${selectedDay === day.key ? "ring-1 ring-primary" : ""} ${
              conflictDays.has(day.key) ? "border-error/70 bg-error/10" : ""
            }`}
          >
            <span className="text-xs">{day.day}</span>
            {day.count > 0 && (
              <span
                className={`absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[10px] text-primary-content ${
                  conflictDays.has(day.key) ? "bg-error" : "bg-primary"
                }`}
              >
                {day.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 border-t border-base-content/10 pt-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
          Schedule for {selectedDay}
        </p>
        {selectedBookings.length === 0 ? (
          <p className="mt-2 text-sm text-base-content/70">No bookings on this date.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded border border-base-content/10">
            <table className="table table-sm">
              <thead>
                <tr className="border-b border-base-content/10 text-[10px] uppercase tracking-[0.2em] text-base-content/60">
                  <th className="bg-base-200/60">Activity</th>
                  <th className="bg-base-200/60">Instructor</th>
                  <th className="bg-base-200/60">Booker</th>
                  <th className="w-28 bg-base-200/60 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {selectedBookings.map((b) => {
                  const isCancelled = b.status === "cancelled";
                  return (
                  <Fragment key={b.id}>
                    <tr
                      className={
                        conflictIds.has(b.id) ? "bg-error/10 outline outline-1 -outline-offset-1 outline-error/40" : ""
                      }
                    >
                      <td className="font-medium">{b.activityName}</td>
                      <td>{b.instructorName}</td>
                      <td>
                        {isCancelled ? (
                          <span className="text-base-content/50 italic">Withheld</span>
                        ) : (
                          b.customerName
                        )}
                      </td>
                      <td className="text-right">
                        {isCancelled ? (
                          <span className="text-[10px] uppercase tracking-wider text-base-content/45">
                            Locked
                          </span>
                        ) : editingId === b.id ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs uppercase tracking-wider"
                            onClick={() => setEditingId(null)}
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs uppercase tracking-wider"
                            onClick={() => setEditingId(b.id)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                    {conflictIds.has(b.id) && editingId !== b.id && !isCancelled && (
                      <tr className="bg-error/5">
                        <td colSpan={4} className="py-1 text-[10px] uppercase tracking-[0.2em] text-error">
                          Schedule conflict for this instructor
                        </td>
                      </tr>
                    )}
                    {editingId === b.id && !isCancelled && (
                      <tr>
                        <td colSpan={4} className="border-t border-base-content/10 bg-base-200/40 p-4">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-base-content/60">
                            {b.reference} · {formatTimeLabel(b.startTime)} –{" "}
                            {formatTimeLabel(b.endTime)}
                          </p>
                          {conflictIds.has(b.id) && (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-error">
                              Schedule conflict for this instructor
                            </p>
                          )}
                          <form
                            action={updateBookingStatus}
                            className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4"
                            data-loading-message="Saving changes…"
                            noValidate
                            onSubmit={handleBookingSubmit}
                          >
                            <input type="hidden" name="id" value={b.id} />
                            <input type="hidden" name="return_to" value="/admin" />
                            <input
                              type="hidden"
                              name="current_special_requests"
                              value={b.specialRequests ?? ""}
                            />
                            <label className="form-control">
                              <span className="label-text text-[10px] uppercase tracking-[0.2em]">
                                Status
                              </span>
                              <select
                                name="status"
                                defaultValue={b.status}
                                className="select select-bordered select-sm bg-base-100"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="form-control">
                              <span className="label-text text-[10px] uppercase tracking-[0.2em]">
                                Start time
                              </span>
                              <select
                                name="preferred_time"
                                defaultValue={b.startTime ?? ""}
                                className="select select-bordered select-sm bg-base-100"
                              >
                                <option value="">No preference</option>
                                {TIME_OPTIONS.map((time) => (
                                  <option key={`start-${time}`} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="form-control">
                              <span className="label-text text-[10px] uppercase tracking-[0.2em]">
                                End time
                              </span>
                              <select
                                name="preferred_time_end"
                                defaultValue={b.endTime ?? ""}
                                className="select select-bordered select-sm bg-base-100"
                              >
                                <option value="">No preference</option>
                                {TIME_OPTIONS.map((time) => (
                                  <option key={`end-${time}`} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="form-control">
                              <span className="label-text text-[10px] uppercase tracking-[0.2em]">
                                Instructor <span className="text-error">*</span>
                              </span>
                              <select
                                name="employee_id"
                                defaultValue={b.employeeId ?? ""}
                                className="select select-bordered select-sm bg-base-100"
                              >
                                <option value="" disabled>
                                  Select employee
                                </option>
                                {employees.map((employee) => (
                                  <option key={employee.id} value={employee.id}>
                                    {employee.name} ({employee.employee_code}) - {employee.role}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="form-control md:col-span-4">
                              <span className="label-text text-[10px] uppercase tracking-[0.2em]">
                                Internal notes
                              </span>
                              <textarea
                                name="internal_notes"
                                defaultValue={b.internalNotes ?? ""}
                                rows={2}
                                className="textarea textarea-bordered textarea-sm bg-base-100"
                              />
                            </label>
                            <div className="flex flex-wrap items-center gap-2 md:col-span-4">
                              <button
                                type="submit"
                                className="btn btn-sm btn-primary"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
