import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarX,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock,
  LayoutDashboard,
  Sparkles,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { AdminAlert } from "@/components/ui/AdminAlert";
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

const STATUS_ICONS: Record<BookingStatus, LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle2,
  cancelled: XCircle,
  completed: Sparkles,
};

const STATUS_ACCENTS: Record<BookingStatus, string> = {
  pending: "text-warning",
  confirmed: "text-success",
  cancelled: "text-error",
  completed: "text-info",
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

  const todayLabel = now.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5 border-b border-base-content/10 pb-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
              Overview
            </p>
            <h1 className="font-display mt-2 text-4xl uppercase">Dashboard</h1>
            <p className="mt-2 text-sm text-base-content/65">{todayLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 border border-base-content/15 bg-base-100 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-base-content/75 transition hover:border-primary/40 hover:text-primary"
          >
            <ClipboardList className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            All bookings
          </Link>
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-2 border border-base-content/15 bg-base-100 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-base-content/75 transition hover:border-primary/40 hover:text-primary"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Employees
          </Link>
        </div>
      </header>

      {(countMap.pending ?? 0) > 0 ? (
        <AdminAlert
          variant="info"
          href="/admin/bookings?status=pending"
          message={`${countMap.pending} pending booking${countMap.pending === 1 ? "" : "s"} awaiting review.`}
        />
      ) : null}

      <ProfitInsightsBoard rows={profitRows} />

      <section>
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/55">
          <CircleDot className="h-3 w-3" strokeWidth={1.75} aria-hidden />
          Bookings snapshot
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-base-content/10 bg-base-content/10 md:grid-cols-5">
          <Stat label="Total" value={total} icon={ClipboardList} />
          {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((s) => (
            <Stat
              key={s}
              label={STATUS_LABELS[s]}
              value={countMap[s] ?? 0}
              icon={STATUS_ICONS[s]}
              accentClassName={STATUS_ACCENTS[s]}
              href={`/admin/bookings?status=${s}`}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OpsCard
          tone="warning"
          icon={AlertTriangle}
          eyebrow="Ops warning"
          title={`Unassigned upcoming (${unassignedUpcoming.length})`}
          emptyLabel="All upcoming bookings have an instructor assigned."
          isEmpty={unassignedUpcoming.length === 0}
        >
          {unassignedUpcoming.map((row) => {
            const activityName = Array.isArray(row.activity)
              ? row.activity[0]?.name
              : row.activity?.name;
            return (
              <Link
                key={row.id}
                href={`/admin/bookings#${row.id}`}
                className="group flex items-start justify-between gap-3 border border-warning/15 bg-base-100/70 px-3 py-2 text-sm text-base-content/80 transition hover:border-warning/40 hover:bg-base-100"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-[11px] text-warning">
                    {row.reference}
                  </span>{" "}
                  · {row.customer_name}{" "}
                  <span className="text-base-content/55">
                    ({activityName || "Unknown activity"})
                  </span>
                  <span className="block text-[11px] text-base-content/55">
                    {formatDate(row.preferred_date)}
                  </span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-base-content/40 transition group-hover:text-warning" />
              </Link>
            );
          })}
        </OpsCard>

        <OpsCard
          tone="error"
          icon={CalendarX}
          eyebrow="Scheduling risk"
          title={`Instructor conflicts (${conflicts.length})`}
          emptyLabel="No overlapping instructor bookings found."
          isEmpty={conflicts.length === 0}
        >
          {conflicts.slice(0, 8).map((c, idx) => (
            <div
              key={`${c.leftRef}-${c.rightRef}-${idx}`}
              className="border border-error/15 bg-base-100/70 px-3 py-2 text-sm text-base-content/80"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-error/80">
                {c.employee} · {formatDate(c.date)}
              </p>
              <p className="mt-1">
                <span className="font-mono text-[11px]">{c.leftRef}</span> (
                {c.leftCustomer}, {c.leftActivity})
                <span className="text-base-content/45"> overlaps with </span>
                <span className="font-mono text-[11px]">{c.rightRef}</span> (
                {c.rightCustomer}, {c.rightActivity})
              </p>
            </div>
          ))}
        </OpsCard>
      </section>

      <section>
        <SectionHeading
          icon={Users}
          title="Employee operations"
          description="Live status of active staff based on today's and upcoming assignments."
          actionHref="/admin/employees"
          actionLabel="Manage employees"
        />
        <div className="mt-4 overflow-hidden border border-base-content/10 bg-base-100">
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
                <tr
                  key={row.employee.id}
                  className="border-t border-base-content/10 transition hover:bg-base-200/40"
                >
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
        <SectionHeading
          icon={ClipboardList}
          title="Latest bookings"
          description="Most recent customer requests across the catalog."
          actionHref="/admin/bookings"
          actionLabel="View all"
        />
        <div className="mt-4 overflow-hidden border border-base-content/10 bg-base-100">
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
                <tr
                  key={b.id}
                  className="border-t border-base-content/10 transition hover:bg-base-200/40"
                >
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
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.28em] hover:text-primary"
                    >
                      Open
                      <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} aria-hidden />
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

function Stat({
  label,
  value,
  icon: Icon,
  accentClassName,
  href,
}: {
  label: string;
  value: number;
  icon?: LucideIcon;
  accentClassName?: string;
  href?: string;
}) {
  const body = (
    <div className="group flex h-full flex-col gap-2 bg-base-100 p-6 transition hover:bg-base-200/60">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          {label}
        </p>
        {Icon ? (
          <Icon
            className={`h-3.5 w-3.5 ${accentClassName ?? "text-base-content/40"}`}
            strokeWidth={1.75}
            aria-hidden
          />
        ) : null}
      </div>
      <p className="font-display text-4xl">{value}</p>
      {href ? (
        <span className="mt-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.28em] text-base-content/45 transition group-hover:text-primary">
          View
          <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-1 focus:ring-primary/30">
        {body}
      </Link>
    );
  }
  return body;
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl uppercase">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-base-content/65">{description}</p>
          ) : null}
        </div>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 self-start text-xs uppercase tracking-[0.28em] text-base-content/70 transition hover:text-primary md:self-end"
        >
          {actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function OpsCard({
  tone,
  icon: Icon,
  eyebrow,
  title,
  emptyLabel,
  isEmpty,
  children,
}: {
  tone: "warning" | "error";
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  emptyLabel: string;
  isEmpty: boolean;
  children?: React.ReactNode;
}) {
  const toneStyles =
    tone === "warning"
      ? {
          border: "border-warning/30",
          bg: "bg-warning/5",
          badgeBg: "bg-warning/15",
          text: "text-warning",
        }
      : {
          border: "border-error/30",
          bg: "bg-error/5",
          badgeBg: "bg-error/15",
          text: "text-error",
        };
  return (
    <div className={`flex flex-col gap-4 border ${toneStyles.border} ${toneStyles.bg} p-5`}>
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${toneStyles.badgeBg} ${toneStyles.text}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <p
            className={`text-[10px] uppercase tracking-[0.28em] ${toneStyles.text}`}
          >
            {eyebrow}
          </p>
          <h3 className="font-display mt-1 text-xl uppercase">{title}</h3>
        </div>
      </div>
      {isEmpty ? (
        <p className="rounded border border-dashed border-base-content/15 bg-base-100/40 px-3 py-3 text-sm text-base-content/65">
          {emptyLabel}
        </p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
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
