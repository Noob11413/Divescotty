"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  createAdminBooking,
  type AdminCreateBookingState,
} from "@/app/actions/bookings";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  defaultPartySizeForBooking,
  PARTY_SIZE_MAX,
  PARTY_SIZE_MIN,
} from "@/lib/booking-party-limits";

const initialState: AdminCreateBookingState = {};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

type ActivityOption = {
  id: string;
  name: string;
  min_party: number;
  max_party: number;
  location_ids: string[];
};

export function AdminCreateBookingForm({
  activities,
  locations,
  employees,
}: {
  activities: ActivityOption[];
  locations: { id: string; name: string }[];
  employees: Array<{
    id: string;
    name: string;
    employee_code: string;
    role: string;
  }>;
}) {
  const [state, formAction, pending] = useActionState(
    createAdminBooking,
    initialState,
  );
  const [activityId, setActivityId] = useState(activities[0]?.id ?? "");

  const selected = activities.find((a) => a.id === activityId);
  const partyDefault = selected
    ? defaultPartySizeForBooking(selected.min_party, selected.max_party)
    : PARTY_SIZE_MIN;

  const offeredLocations = useMemo(() => {
    if (!selected?.location_ids.length) return locations;
    const allowed = new Set(selected.location_ids);
    return locations.filter((l) => allowed.has(l.id));
  }, [selected, locations]);

  const { showToast, hideLoading } = useAdminToast();

  useEffect(() => {
    if (!pending && !state?.formError) {
      hideLoading();
    }
  }, [pending, state?.formError, hideLoading]);

  useEffect(() => {
    if (state?.formError) {
      void showToast({ message: state.formError, variant: "error" });
    }
  }, [state, showToast]);

  return (
    <form
      action={formAction}
      className="flex max-w-2xl flex-col gap-5"
      data-loading-message="Creating booking…"
    >
      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Activity
        </span>
        <select
          name="activityId"
          required
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          className="select select-bordered bg-base-100"
        >
          {activities.length === 0 ? (
            <option value="">No published activities</option>
          ) : (
            activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))
          )}
        </select>
        {state?.fieldErrors?.activityId && (
          <span className="text-xs text-error">{state.fieldErrors.activityId}</span>
        )}
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Customer name"
          name="customerName"
          required
          error={state?.fieldErrors?.customerName}
        />
        <Field
          label="Email"
          name="customerEmail"
          type="email"
          required
          error={state?.fieldErrors?.customerEmail}
        />
      </div>

      <Field
        label="Phone / WhatsApp"
        name="customerPhone"
        type="tel"
        required
        error={state?.fieldErrors?.customerPhone}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field
          label="Party size"
          name="partySize"
          type="number"
          min={PARTY_SIZE_MIN}
          max={PARTY_SIZE_MAX}
          defaultValue={partyDefault}
          key={activityId}
          required
          error={state?.fieldErrors?.partySize}
        />
        <Field
          label="Trip date"
          name="preferredDate"
          type="date"
          required
          error={state?.fieldErrors?.preferredDate}
        />
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Start time
          </span>
          <select
            name="preferredTime"
            defaultValue=""
            className="select select-bordered bg-base-100"
          >
            <option value="">No preference</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          End time (optional)
        </span>
        <select
          name="preferredTimeEnd"
          defaultValue=""
          className="select select-bordered bg-base-100"
        >
          <option value="">—</option>
          {TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Departure location
          </span>
          <select
            name="locationId"
            defaultValue=""
            className="select select-bordered bg-base-100"
          >
            <option value="">No preference</option>
            {offeredLocations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Assign employee
          </span>
          <select
            name="employeeId"
            defaultValue=""
            className="select select-bordered bg-base-100"
          >
            <option value="">Unassigned</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employee_code}) — {e.role}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Initial status
        </span>
        <select
          name="initialStatus"
          defaultValue="pending"
          className="select select-bordered bg-base-100"
        >
          <option value="pending">Pending (send request received email)</option>
          <option value="confirmed">Confirmed (send confirmed email)</option>
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Internal / special notes
        </span>
        <textarea
          name="specialRequests"
          rows={3}
          className="textarea textarea-bordered bg-base-100"
          placeholder="Walk-in, phone booking, certifications…"
        />
      </label>

      <button
        type="submit"
        disabled={pending || activities.length === 0}
        className="inline-flex items-center justify-center gap-3 bg-primary px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Create booking
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input name={name} className="input input-bordered bg-base-100" {...rest} />
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}
