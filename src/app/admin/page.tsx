import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { BookingStatus } from "@/lib/supabase/database.types";
import { BookingCalendarBoard, type CalendarBooking } from "./BookingCalendarBoard";
import { ProfitInsightsBoard } from "./ProfitInsightsBoard";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [counts, recent, calendar, employeesRes, monthProfitRes] = await Promise.all([
    Promise.all(
      (
        ["pending", "confirmed", "cancelled", "completed"] as BookingStatus[]
      ).map(async (s) => {
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", s);
        return [s, count ?? 0] as const;
      }),
    ),
    supabase
      .from("bookings")
      .select(
        "id, reference, customer_name, party_size, preferred_date, status, created_at, activity:activities(name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("bookings")
      .select(
        "id, reference, customer_name, preferred_date, preferred_time, special_requests, status, internal_notes, activity:activities(name), employee:employees(id, name)",
      )
      .order("preferred_date", { ascending: true })
      .limit(300),
    supabase
      .from("employees")
      .select("id, name, employee_code, role")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("bookings")
      .select(
        "preferred_date, status, activity:activities(price_cents, category:categories(name))",
      )
      .gte("preferred_date", sixMonthsAgo.toISOString().slice(0, 10))
      .lte("preferred_date", new Date().toISOString().slice(0, 10)),
  ]);

  const countMap = Object.fromEntries(counts) as Record<BookingStatus, number>;
  const total = (Object.values(countMap) as number[]).reduce(
    (a, b) => a + b,
    0,
  );
  const recentRows = (recent.data ?? []) as Array<{
    id: string;
    reference: string;
    customer_name: string;
    party_size: number;
    preferred_date: string;
    status: BookingStatus;
    activity?: { name?: string | null } | Array<{ name?: string | null }> | null;
  }>;
  const calendarRows = (calendar.data ?? []) as Array<{
    id: string;
    reference: string;
    customer_name: string;
    preferred_date: string;
    preferred_time: string | null;
    special_requests: string | null;
    status: BookingStatus;
    internal_notes: string | null;
    activity?: { name?: string | null } | Array<{ name?: string | null }> | null;
    employee?:
      | { id?: string | null; name?: string | null }
      | Array<{ id?: string | null; name?: string | null }>
      | null;
  }>;
  const calendarBookings: CalendarBooking[] = calendarRows.map((row) => {
    const special = row.special_requests ?? "";
    const endMatch = special.match(/(?:^|\|)\s*End time:\s*([0-2]\d:[0-5]\d(?:[:][0-5]\d)?)\s*(?:\||$)/i);
    const activityName = Array.isArray(row.activity)
      ? row.activity[0]?.name
      : row.activity?.name;
    const employeeName = Array.isArray(row.employee)
      ? row.employee[0]?.name
      : row.employee?.name;
    return {
      id: row.id,
      reference: row.reference,
      customerName: row.customer_name,
      preferredDate: row.preferred_date,
      startTime: row.preferred_time,
      endTime: endMatch?.[1] ?? null,
      activityName: activityName || "Unknown activity",
      instructorName: employeeName || "Unassigned",
      status: row.status,
      employeeId: Array.isArray(row.employee)
        ? row.employee[0]?.id ?? null
        : row.employee?.id ?? null,
      internalNotes: row.internal_notes ?? null,
      specialRequests: row.special_requests ?? null,
    };
  });
  const employees = (employeesRes.data ?? []) as Array<{
    id: string;
    name: string;
    employee_code: string;
    role: string;
  }>;
  const monthProfitRows = (monthProfitRes.data ?? []) as Array<{
    preferred_date: string;
    status: BookingStatus;
    activity?:
      | {
          price_cents?: number | null;
          category?: { name?: string | null } | Array<{ name?: string | null }> | null;
        }
      | Array<{
          price_cents?: number | null;
          category?: { name?: string | null } | Array<{ name?: string | null }> | null;
        }>
      | null;
  }>;
  const profitRows = monthProfitRows.map((row) => {
    const activity = Array.isArray(row.activity) ? row.activity[0] : row.activity;
    const category = Array.isArray(activity?.category)
      ? activity?.category?.[0]
      : activity?.category;
    return {
      preferredDate: row.preferred_date,
      status: row.status,
      priceCents: activity?.price_cents ?? 0,
      categoryName: category?.name || "Uncategorized",
    };
  });
  const unassignedUpcoming = calendarRows
    .filter(
      (row) =>
        row.preferred_date >= todayIso &&
        (row.status === "pending" || row.status === "confirmed") &&
        (!row.employee ||
          (Array.isArray(row.employee)
            ? !row.employee[0]?.id
            : !row.employee?.id)),
    )
    .slice(0, 8);

  const timeToMinutes = (value: string | null) => {
    if (!value) return null;
    const [hh, mm] = value.split(":");
    if (!hh || !mm) return null;
    return Number(hh) * 60 + Number(mm);
  };
  const endTimeFromSpecial = (special: string | null) => {
    if (!special) return null;
    const match = special.match(
      /(?:^|\|)\s*End time:\s*([0-2]\d:[0-5]\d(?:[:][0-5]\d)?)\s*(?:\||$)/i,
    );
    return match?.[1] ?? null;
  };
  const conflictCandidates = calendarRows
    .filter((row) => row.status === "pending" || row.status === "confirmed")
    .map((row) => {
      const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee;
      const start = timeToMinutes(row.preferred_time);
      const parsedEnd = timeToMinutes(endTimeFromSpecial(row.special_requests));
      const end = parsedEnd ?? (start != null ? start + 60 : null);
      return {
        id: row.id,
        reference: row.reference,
        preferred_date: row.preferred_date,
        customer_name: row.customer_name,
        activity_name: Array.isArray(row.activity)
          ? row.activity[0]?.name ?? "Unknown activity"
          : row.activity?.name ?? "Unknown activity",
        employee_id: employee?.id ?? null,
        employee_name: employee?.name ?? "Unassigned",
        start,
        end,
      };
    })
    .filter((row) => row.employee_id && row.start != null && row.end != null);

  const conflicts: Array<{
    date: string;
    employee: string;
    leftRef: string;
    leftCustomer: string;
    leftActivity: string;
    rightRef: string;
    rightCustomer: string;
    rightActivity: string;
  }> = [];
  const grouped = new Map<string, typeof conflictCandidates>();
  for (const row of conflictCandidates) {
    const key = `${row.employee_id}|${row.preferred_date}`;
    const arr = grouped.get(key) ?? [];
    arr.push(row);
    grouped.set(key, arr);
  }
  grouped.forEach((rows) => {
    const sorted = [...rows].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if ((a.end ?? 0) > (b.start ?? Number.MAX_SAFE_INTEGER)) {
        conflicts.push({
          date: a.preferred_date,
          employee: a.employee_name,
          leftRef: a.reference,
          leftCustomer: a.customer_name,
          leftActivity: a.activity_name,
          rightRef: b.reference,
          rightCustomer: b.customer_name,
          rightActivity: b.activity_name,
        });
      }
    }
  });

  const activeEmployees = employees.filter((employee) => employee.role && true);
  const parseMinutes = (timeValue: string | null) => {
    if (!timeValue) return null;
    const [hh, mm] = timeValue.split(":");
    if (!hh || !mm) return null;
    return Number(hh) * 60 + Number(mm);
  };
  const employeeOpsRows = activeEmployees.map((employee) => {
    const assignments = calendarRows
      .filter((row) => {
        const emp = Array.isArray(row.employee) ? row.employee[0] : row.employee;
        return (
          !!emp?.id &&
          emp.id === employee.id &&
          (row.status === "pending" || row.status === "confirmed")
        );
      })
      .map((row) => ({
        id: row.id,
        reference: row.reference,
        date: row.preferred_date,
        time: row.preferred_time,
        activityName: Array.isArray(row.activity)
          ? row.activity[0]?.name ?? "Unknown activity"
          : row.activity?.name ?? "Unknown activity",
      }));

    const todayAssignments = assignments
      .filter((job) => job.date === todayIso)
      .sort((a, b) => (parseMinutes(a.time) ?? 9999) - (parseMinutes(b.time) ?? 9999));

    const currentJob =
      todayAssignments.find((job) => (parseMinutes(job.time) ?? 9999) <= nowMinutes) ??
      todayAssignments[0] ??
      null;

    const nextJob =
      assignments
        .filter((job) => {
          if (job.date > todayIso) return true;
          if (job.date < todayIso) return false;
          const mins = parseMinutes(job.time);
          return mins == null || mins > nowMinutes;
        })
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (parseMinutes(a.time) ?? 9999) - (parseMinutes(b.time) ?? 9999);
        })[0] ?? null;

    const status: "busy" | "scheduled" | "available" = currentJob
      ? "busy"
      : nextJob
        ? "scheduled"
        : "available";

    return {
      employee,
      currentJob,
      nextJob,
      status,
    };
  });

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Overview
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase">Dashboard</h1>
      </header>

      <ProfitInsightsBoard rows={profitRows} />

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded border border-base-content/10 bg-base-content/10 md:grid-cols-5">
        <Stat label="Total" value={total} />
        {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((s) => (
          <Stat key={s} label={STATUS_LABELS[s]} value={countMap[s] ?? 0} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-warning/30 bg-warning/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-warning">
            Ops warning
          </p>
          <h3 className="font-display mt-2 text-xl uppercase">
            Unassigned upcoming ({unassignedUpcoming.length})
          </h3>
          {unassignedUpcoming.length === 0 ? (
            <p className="mt-2 text-sm text-base-content/70">
              No unassigned pending/confirmed bookings.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {unassignedUpcoming.map((row) => {
                const activityName = Array.isArray(row.activity)
                  ? row.activity[0]?.name
                  : row.activity?.name;
                return (
                  <p key={row.id} className="text-sm text-base-content/80">
                    <span className="font-mono text-xs">{row.reference}</span>{" "}
                    - {row.customer_name} ({activityName || "Unknown activity"}) on{" "}
                    {formatDate(row.preferred_date)}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className="border border-error/30 bg-error/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-error">
            Scheduling risk
          </p>
          <h3 className="font-display mt-2 text-xl uppercase">
            Instructor conflicts ({conflicts.length})
          </h3>
          {conflicts.length === 0 ? (
            <p className="mt-2 text-sm text-base-content/70">
              No overlapping instructor bookings found.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {conflicts.slice(0, 8).map((c, idx) => (
                <p key={`${c.leftRef}-${c.rightRef}-${idx}`} className="text-sm text-base-content/80">
                  {c.employee} has overlap on {formatDate(c.date)}: {c.leftRef}{" "}
                  ({c.leftCustomer}, {c.leftActivity}) and {c.rightRef} (
                  {c.rightCustomer}, {c.rightActivity})
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl uppercase">Employee operations</h2>
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] hover:text-primary"
          >
            Manage employees
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 overflow-hidden border border-base-content/10">
          <table className="table">
            <thead className="bg-base-200">
              <tr className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                <th>Employee</th>
                <th>Current job</th>
                <th>Next work</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employeeOpsRows.map((row) => (
                <tr key={row.employee.id} className="border-t border-base-content/10">
                  <td>
                    <p className="font-medium">{row.employee.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                      {row.employee.role} · {row.employee.employee_code}
                    </p>
                  </td>
                  <td>
                    {row.currentJob ? (
                      <>
                        <p className="text-sm">{row.currentJob.activityName}</p>
                        <p className="font-mono text-xs text-base-content/60">
                          {row.currentJob.reference} · {formatDate(row.currentJob.date)}
                          {row.currentJob.time ? ` ${row.currentJob.time}` : ""}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-base-content/60">No current assignment</span>
                    )}
                  </td>
                  <td>
                    {row.nextJob ? (
                      <>
                        <p className="text-sm">{row.nextJob.activityName}</p>
                        <p className="font-mono text-xs text-base-content/60">
                          {row.nextJob.reference} · {formatDate(row.nextJob.date)}
                          {row.nextJob.time ? ` ${row.nextJob.time}` : ""}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-base-content/60">No upcoming assignment</span>
                    )}
                  </td>
                  <td>
                    <EmployeeStatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
              {employeeOpsRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-base-content/60">
                    No active employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl uppercase">Latest bookings</h2>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] hover:text-primary"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-hidden border border-base-content/10">
          <table className="table">
            <thead className="bg-base-200">
              <tr className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                <th>Reference</th>
                <th>Customer</th>
                <th>Activity</th>
                <th>Party</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentRows.map((b) => (
                <tr key={b.id} className="border-t border-base-content/10">
                  <td className="font-mono text-xs">{b.reference}</td>
                  <td>{b.customer_name}</td>
                  <td>
                    {Array.isArray(b.activity)
                      ? b.activity[0]?.name
                      : b.activity?.name}
                  </td>
                  <td>{b.party_size}</td>
                  <td>{formatDate(b.preferred_date)}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>
                    <Link
                      href={`/admin/bookings#${b.id}`}
                      className="text-xs uppercase tracking-[0.28em] hover:text-primary"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {recentRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-base-content/60">
                    No bookings yet — they&apos;ll show up here as soon as
                    customers submit requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <BookingCalendarBoard
        bookings={calendarBookings}
        employees={employees}
      />
    </div>
  );
}

function EmployeeStatusBadge({ status }: { status: "busy" | "scheduled" | "available" }) {
  const styles: Record<typeof status, string> = {
    busy: "bg-error/20 text-error-content border-error/40",
    scheduled: "bg-warning/20 text-warning-content border-warning/40",
    available: "bg-success/20 text-success-content border-success/40",
  };
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-base-100 p-6">
      <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </p>
      <p className="font-display mt-2 text-4xl">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-warning/20 text-warning-content border-warning/40",
    confirmed: "bg-success/20 text-success-content border-success/40",
    completed: "bg-info/20 text-info-content border-info/40",
    cancelled: "bg-error/20 text-error-content border-error/40",
  };
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}
