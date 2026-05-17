import Link from "next/link";
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminPagination,
} from "@/components/admin/AdminPagination";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { BookingStatus } from "@/lib/supabase/database.types";
import { BookingRow } from "./BookingRow";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  payment?: string;
  q?: string;
  page?: string;
  activity?: string;
  location?: string;
  employee?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  view?: string;
  created?: string;
}

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const PAYMENT_OPTIONS = ["unpaid", "partial", "paid", "refunded"] as const;

type AdminBookingRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  preferred_date: string;
  preferred_time: string | null;
  status: BookingStatus;
  internal_notes: string | null;
  special_requests: string | null;
  quoted_total_cents: number;
  quoted_currency: string;
  payment_status: "unpaid" | "partial" | "paid" | "refunded";
  amount_paid_cents: number;
  payment_method_mock: string | null;
  paid_at: string | null;
  fuel_cost_cents: number;
  tank_cost_cents: number;
  tank_qty: number;
  tank_unit_cost_cents: number;
  gear_cost_cents: number;
  gear_qty: number;
  gear_unit_cost_cents: number;
  other_cost_cents: number;
  instructor_hours: number;
  instructor_payout_cents: number;
  total_cost_cents: number;
  estimated_profit_cents: number;
  created_at: string;
  employee_id: string | null;
  activity?:
    | { id?: string; name?: string | null; price_cents?: number | null }
    | Array<{ id?: string; name?: string | null; price_cents?: number | null }>
    | null;
  location?: { name?: string | null } | Array<{ name?: string | null }> | null;
  employee?:
    | {
        id?: string;
        name?: string | null;
        employee_code?: string | null;
        role?: string | null;
        photo_url?: string | null;
        phone?: string | null;
        email?: string | null;
      }
    | Array<{
        id?: string;
        name?: string | null;
        employee_code?: string | null;
        role?: string | null;
        photo_url?: string | null;
        phone?: string | null;
        email?: string | null;
      }>
    | null;
};

type CostTemplateRow = {
  activity_id: string;
  default_fuel_cost_cents: number;
  default_fuel_hourly_cost_cents: number;
  default_tank_cost_cents: number;
  default_tank_qty: number;
  default_tank_unit_cost_cents: number;
  default_gear_cost_cents: number;
  default_gear_qty: number;
  default_gear_unit_cost_cents: number;
  default_other_cost_cents: number;
  default_instructor_hours: number;
};

type FilterState = {
  status: BookingStatus | null;
  payment: (typeof PAYMENT_OPTIONS)[number] | null;
  q: string;
  activityId: string | null;
  locationId: string | null;
  employeeId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  sort: "created" | "trip";
  view: "unassigned" | "upcoming" | null;
};

function parseFilters(sp: SearchParams): FilterState {
  const status =
    sp.status && STATUS_OPTIONS.includes(sp.status as BookingStatus)
      ? (sp.status as BookingStatus)
      : null;
  const payment =
    sp.payment && PAYMENT_OPTIONS.includes(sp.payment as (typeof PAYMENT_OPTIONS)[number])
      ? (sp.payment as (typeof PAYMENT_OPTIONS)[number])
      : null;
  const view =
    sp.view === "unassigned" || sp.view === "upcoming" ? sp.view : null;
  return {
    status,
    payment,
    q: sp.q?.trim() ?? "",
    activityId: sp.activity?.trim() || null,
    locationId: sp.location?.trim() || null,
    employeeId: sp.employee?.trim() || null,
    dateFrom: sp.date_from?.trim() || null,
    dateTo: sp.date_to?.trim() || null,
    sort: sp.sort === "trip" ? "trip" : "created",
    view,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyListFilters(query: any, filters: FilterState) {
  let q = query;
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.payment) q = q.eq("payment_status", filters.payment);
  if (filters.activityId) q = q.eq("activity_id", filters.activityId);
  if (filters.locationId) q = q.eq("location_id", filters.locationId);
  if (filters.employeeId) q = q.eq("employee_id", filters.employeeId);
  if (filters.dateFrom) q = q.gte("preferred_date", filters.dateFrom);
  if (filters.dateTo) q = q.lte("preferred_date", filters.dateTo);
  if (filters.q) {
    q = q.or(
      `reference.ilike.%${filters.q}%,customer_name.ilike.%${filters.q}%,customer_email.ilike.%${filters.q}%`,
    );
  }
  if (filters.view === "unassigned") {
    q = q.is("employee_id", null);
    q = q.in("status", ["pending", "confirmed"]);
  }
  if (filters.view === "upcoming") {
    const today = new Date().toISOString().slice(0, 10);
    q = q.gte("preferred_date", today);
    q = q.in("status", ["pending", "confirmed"]);
  }
  return q;
}

function paginationQuery(filters: FilterState): Record<string, string | undefined> {
  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.payment ? { payment: filters.payment } : {}),
    ...(filters.activityId ? { activity: filters.activityId } : {}),
    ...(filters.locationId ? { location: filters.locationId } : {}),
    ...(filters.employeeId ? { employee: filters.employeeId } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.sort !== "created" ? { sort: filters.sort } : {}),
    ...(filters.view ? { view: filters.view } : {}),
  };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const rawPage = Number(sp.page);
  const requestedPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const supabase = await createClient();
  const [employeesRes, templatesRes, activitiesRes, locationsRes, countRes] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, name, employee_code, role, photo_url, phone, email")
        .eq("is_active", true)
        .order("name"),
      supabase.from("activity_cost_templates").select("*"),
      supabase
        .from("activities")
        .select("id, name")
        .eq("is_published", true)
        .order("name"),
      supabase.from("locations").select("id, name").order("name"),
      applyListFilters(
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        filters,
      ),
    ]);

  const total = countRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * ADMIN_LIST_PAGE_SIZE;
  const to = from + ADMIN_LIST_PAGE_SIZE - 1;

  let dataQuery = applyListFilters(
    supabase
      .from("bookings")
      .select(
        `
      *,
      activity:activities(id, slug, name, price_cents, category:categories(slug, name)),
      location:locations(slug, name),
      employee:employees(id, name, employee_code, role, photo_url, phone, email)
    `,
      )
      .range(from, to),
    filters,
  );

  if (filters.sort === "trip") {
    dataQuery = dataQuery
      .order("preferred_date", { ascending: true })
      .order("created_at", { ascending: false });
  } else {
    dataQuery = dataQuery.order("created_at", { ascending: false });
  }

  const { data } = await dataQuery;
  const rows = (data ?? []) as AdminBookingRow[];
  const templates = (templatesRes.data ?? []) as CostTemplateRow[];
  const templateByActivityId = new Map(templates.map((t) => [t.activity_id, t]));
  const employees = (employeesRes.data ?? []) as Array<{
    id: string;
    name: string;
    employee_code: string;
    role: string;
    photo_url: string | null;
    phone: string | null;
    email: string | null;
  }>;
  const activities = (activitiesRes.data ?? []) as Array<{ id: string; name: string }>;
  const locations = (locationsRes.data ?? []) as Array<{ id: string; name: string }>;
  const pageQuery = paginationQuery(filters);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            All requests
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Bookings</h1>
        </div>
        <Link
          href="/admin/bookings/new"
          className="border border-primary bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
        >
          New booking
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { label: "All", href: "/admin/bookings" },
            { label: "Unassigned", href: "/admin/bookings?view=unassigned" },
            { label: "Upcoming", href: "/admin/bookings?view=upcoming" },
          ] as const
        ).map((chip) => {
          const active =
            chip.href === "/admin/bookings"
              ? !filters.view
              : filters.view === chip.href.split("view=")[1];
          return (
            <Link
              key={chip.href}
              href={chip.href}
              className={`border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${
                active
                  ? "border-base-content bg-base-content text-base-100"
                  : "border-base-content/30 hover:bg-base-content/10"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <form method="GET" className="flex flex-col gap-3 rounded border border-base-content/10 bg-base-200/30 p-4">
        <input type="hidden" name="page" value="1" />
        {filters.view ? <input type="hidden" name="view" value={filters.view} /> : null}
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Reference, name or email"
            className="input input-bordered input-sm min-w-[200px] flex-1 bg-base-100"
          />
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="select select-bordered select-sm bg-base-100"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            name="payment"
            defaultValue={filters.payment ?? ""}
            className="select select-bordered select-sm bg-base-100"
          >
            <option value="">All payments</option>
            {PAYMENT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            name="activity"
            defaultValue={filters.activityId ?? ""}
            className="select select-bordered select-sm max-w-[180px] bg-base-100"
          >
            <option value="">All activities</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            name="location"
            defaultValue={filters.locationId ?? ""}
            className="select select-bordered select-sm max-w-[160px] bg-base-100"
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            name="employee"
            defaultValue={filters.employeeId ?? ""}
            className="select select-bordered select-sm max-w-[180px] bg-base-100"
          >
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.24em] text-base-content/55">
              Trip from
            </span>
            <input
              type="date"
              name="date_from"
              defaultValue={filters.dateFrom ?? ""}
              className="input input-bordered input-sm bg-base-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.24em] text-base-content/55">
              Trip to
            </span>
            <input
              type="date"
              name="date_to"
              defaultValue={filters.dateTo ?? ""}
              className="input input-bordered input-sm bg-base-100"
            />
          </label>
          <select
            name="sort"
            defaultValue={filters.sort}
            className="select select-bordered select-sm bg-base-100"
          >
            <option value="created">Newest submitted</option>
            <option value="trip">Soonest trip date</option>
          </select>
          <button
            type="submit"
            className="border border-base-content/40 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
          >
            Apply filters
          </button>
          <Link
            href="/admin/bookings"
            className="border border-base-content/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-base-content/70 hover:text-primary"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="overflow-hidden border border-base-content/10">
        <table className="table">
          <thead className="bg-base-200">
            <tr className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
              <th>Reference</th>
              <th>Customer</th>
              <th>Activity</th>
              <th>Party</th>
              <th>Date</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => {
              const activity = Array.isArray(row.activity)
                ? row.activity[0]
                : row.activity;
              const template = templateByActivityId.get(activity?.id ?? "");
              return (
                <BookingRow
                  key={row.id}
                  booking={{
                    id: row.id,
                    reference: row.reference,
                    customer_name: row.customer_name,
                    customer_email: row.customer_email,
                    customer_phone: row.customer_phone,
                    party_size: row.party_size,
                    preferred_date: row.preferred_date,
                    preferred_time: row.preferred_time,
                    status: row.status,
                    internal_notes: row.internal_notes,
                    special_requests: row.special_requests,
                    quoted_total_cents: row.quoted_total_cents,
                    quoted_currency: row.quoted_currency,
                    payment_status: row.payment_status,
                    amount_paid_cents: row.amount_paid_cents,
                    payment_method_mock: row.payment_method_mock,
                    paid_at: row.paid_at,
                    fuel_cost_cents: row.fuel_cost_cents,
                    tank_cost_cents: row.tank_cost_cents,
                    tank_qty: row.tank_qty,
                    tank_unit_cost_cents: row.tank_unit_cost_cents,
                    gear_cost_cents: row.gear_cost_cents,
                    gear_qty: row.gear_qty,
                    gear_unit_cost_cents: row.gear_unit_cost_cents,
                    other_cost_cents: row.other_cost_cents,
                    instructor_hours: row.instructor_hours,
                    instructor_payout_cents: row.instructor_payout_cents,
                    total_cost_cents: row.total_cost_cents,
                    estimated_profit_cents: row.estimated_profit_cents,
                    created_at: row.created_at,
                    activity_name: activity?.name ?? null,
                    activity_price_cents: activity?.price_cents ?? null,
                    template_fuel_cost_cents: template?.default_fuel_cost_cents ?? 0,
                    template_fuel_hourly_cost_cents:
                      template?.default_fuel_hourly_cost_cents ?? 0,
                    template_tank_cost_cents: template?.default_tank_cost_cents ?? 0,
                    template_tank_qty: template?.default_tank_qty ?? 0,
                    template_tank_unit_cost_cents:
                      template?.default_tank_unit_cost_cents ?? 0,
                    template_gear_cost_cents: template?.default_gear_cost_cents ?? 0,
                    template_gear_qty: template?.default_gear_qty ?? 0,
                    template_gear_unit_cost_cents:
                      template?.default_gear_unit_cost_cents ?? 0,
                    template_other_cost_cents: template?.default_other_cost_cents ?? 0,
                    template_instructor_hours: template?.default_instructor_hours ?? 0,
                    location_name: Array.isArray(row.location)
                      ? row.location[0]?.name ?? null
                      : row.location?.name ?? null,
                    employee_id: row.employee_id,
                    employee_name: Array.isArray(row.employee)
                      ? row.employee[0]?.name ?? null
                      : row.employee?.name ?? null,
                    employee_code: Array.isArray(row.employee)
                      ? row.employee[0]?.employee_code ?? null
                      : row.employee?.employee_code ?? null,
                    employee_role: Array.isArray(row.employee)
                      ? row.employee[0]?.role ?? null
                      : row.employee?.role ?? null,
                    employee_photo: Array.isArray(row.employee)
                      ? row.employee[0]?.photo_url ?? null
                      : row.employee?.photo_url ?? null,
                    employee_phone: Array.isArray(row.employee)
                      ? row.employee[0]?.phone ?? null
                      : row.employee?.phone ?? null,
                    employee_email: Array.isArray(row.employee)
                      ? row.employee[0]?.email ?? null
                      : row.employee?.email ?? null,
                  }}
                  preferredDateLabel={formatDate(row.preferred_date)}
                  createdLabel={formatDate(row.created_at)}
                  employees={employees}
                />
              );
            })}
            {(!rows || rows.length === 0) && (
              <tr>
                <td
                  colSpan={9}
                  className="py-16 text-center text-sm text-base-content/60"
                >
                  No bookings match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <AdminPagination
          path="/admin/bookings"
          page={page}
          pageSize={ADMIN_LIST_PAGE_SIZE}
          total={total}
          query={pageQuery}
        />
      </div>
    </div>
  );
}
