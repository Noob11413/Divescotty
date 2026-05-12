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
  q?: string;
  page?: string;
}

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

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

export default async function AdminBookingsPage(
  { searchParams }: { searchParams: Promise<SearchParams> },
) {
  const sp = await searchParams;
  const status =
    sp.status && STATUS_OPTIONS.includes(sp.status as BookingStatus)
      ? (sp.status as BookingStatus)
      : null;
  const q = sp.q?.trim() ?? "";
  const rawPage = Number(sp.page);
  const requestedPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const supabase = await createClient();
  const [employeesRes, templatesRes, countRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id, name, employee_code, role, photo_url, phone, email")
      .eq("is_active", true)
      .order("name"),
    supabase.from("activity_cost_templates").select("*"),
    (() => {
      let countQuery = supabase
        .from("bookings")
        .select("id", { count: "exact", head: true });
      if (status) countQuery = countQuery.eq("status", status);
      if (q) {
        countQuery = countQuery.or(
          `reference.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`,
        );
      }
      return countQuery;
    })(),
  ]);

  const total = countRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * ADMIN_LIST_PAGE_SIZE;
  const to = from + ADMIN_LIST_PAGE_SIZE - 1;

  let dataQuery = supabase
    .from("bookings")
    .select(
      `
      *,
      activity:activities(id, slug, name, price_cents, category:categories(slug, name)),
      location:locations(slug, name),
      employee:employees(id, name, employee_code, role, photo_url, phone, email)
    `,
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) dataQuery = dataQuery.eq("status", status);
  if (q) {
    dataQuery = dataQuery.or(
      `reference.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`,
    );
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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            All requests
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Bookings</h1>
        </div>
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="page" value="1" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Reference, name or email"
            className="input input-bordered input-sm bg-base-200/60"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="select select-bordered select-sm bg-base-200/60"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="border border-base-content/40 px-4 py-1.5 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
          >
            Filter
          </button>
        </form>
      </header>

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
                  colSpan={8}
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
          query={{
            ...(q ? { q } : {}),
            ...(status ? { status } : {}),
          }}
        />
      </div>
    </div>
  );
}
