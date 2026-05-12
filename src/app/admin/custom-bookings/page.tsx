import Link from "next/link";
import {
  convertCustomRequestToBooking,
  updateCustomBookingRequest,
} from "@/app/actions/custom-bookings";
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminPagination,
} from "@/components/admin/AdminPagination";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CustomRequestRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_date: string | null;
  preferred_time: string | null;
  party_size: number;
  quote_amount_cents: number | null;
  quote_currency: string;
  quote_expires_on: string | null;
  request_details: string;
  flexibility: "fixed" | "flexible";
  status: "new" | "quoted" | "approved" | "rejected" | "converted";
  admin_notes: string | null;
  booking_id: string | null;
  location_id: string | null;
  employee_id: string | null;
  created_at: string;
  location?: { name?: string | null } | Array<{ name?: string | null }> | null;
  employee?: { name?: string | null } | Array<{ name?: string | null }> | null;
  booking?: { reference?: string | null } | Array<{ reference?: string | null }> | null;
};

const STATUS_OPTIONS = ["new", "quoted", "approved", "rejected", "converted"] as const;

export default async function AdminCustomBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const rawPage = Number(sp.page);
  const requestedPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const supabase = await createClient();
  const [countRes, activitiesRes, locationsRes, employeesRes] =
    await Promise.all([
      supabase
        .from("custom_booking_requests")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("activities")
        .select("id, name")
        .eq("is_published", true)
        .order("name"),
      supabase.from("locations").select("id, name").order("name"),
      supabase
        .from("employees")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
    ]);

  const total = countRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * ADMIN_LIST_PAGE_SIZE;
  const to = from + ADMIN_LIST_PAGE_SIZE - 1;

  const requestsRes = await supabase
    .from("custom_booking_requests")
    .select(
      `
        *,
        location:locations(name),
        employee:employees(name),
        booking:bookings(reference)
      `,
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const requests = (requestsRes.data ?? []) as CustomRequestRow[];
  const activities = (activitiesRes.data ?? []) as Array<{ id: string; name: string }>;
  const locations = (locationsRes.data ?? []) as Array<{ id: string; name: string }>;
  const employees = (employeesRes.data ?? []) as Array<{ id: string; name: string }>;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Sales pipeline
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Custom bookings</h1>
        </div>
        <Link
          href="/contact"
          className="border border-base-content/35 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
        >
          Open customer form
        </Link>
      </header>

      <div className="flex flex-col gap-6">
        {requests.map((row) => {
          const locationName = Array.isArray(row.location)
            ? row.location[0]?.name
            : row.location?.name;
          const employeeName = Array.isArray(row.employee)
            ? row.employee[0]?.name
            : row.employee?.name;
          const bookingReference = Array.isArray(row.booking)
            ? row.booking[0]?.reference
            : row.booking?.reference;
          return (
            <article key={row.id} className="border border-base-content/10 bg-base-100 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-base-content/60">{row.reference}</p>
                  <h2 className="font-display mt-1 text-2xl uppercase">{row.customer_name}</h2>
                  <p className="mt-1 text-sm text-base-content/70">
                    {row.customer_email} · {row.customer_phone}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-base-content/60">
                    {row.preferred_date ? formatDate(row.preferred_date) : "No date"}{" "}
                    {row.preferred_time ? ` ${row.preferred_time}` : ""} · party {row.party_size} ·{" "}
                    {row.flexibility}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-base-content/80">
                {row.request_details}
              </p>
              <p className="mt-2 text-sm text-base-content/70">
                Location: {locationName ?? "No preference"} · Assigned:{" "}
                {employeeName ?? "Unassigned"}
              </p>
              {(row.quote_amount_cents != null || row.quote_expires_on) && (
                <p className="mt-2 text-sm text-base-content/75">
                  Quote:{" "}
                  {row.quote_amount_cents != null
                    ? `${row.quote_currency} ${(row.quote_amount_cents / 100).toLocaleString()}`
                    : "Not set"}{" "}
                  {row.quote_expires_on ? `· Expires ${formatDate(row.quote_expires_on)}` : ""}
                </p>
              )}
              {bookingReference && (
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-success">
                  Converted booking: {bookingReference}
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <form action={updateCustomBookingRequest} className="border border-base-content/10 p-4">
                  <input type="hidden" name="id" value={row.id} />
                  <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                    Admin update
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                        Status
                      </span>
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="select select-bordered bg-base-100"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                        Assign employee
                      </span>
                      <select
                        name="employee_id"
                        defaultValue={row.employee_id ?? ""}
                        className="select select-bordered bg-base-100"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                        Admin notes
                      </span>
                      <textarea
                        name="admin_notes"
                        rows={3}
                        defaultValue={row.admin_notes ?? ""}
                        className="textarea textarea-bordered bg-base-100"
                      />
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                          Quote amount
                        </span>
                        <input
                          name="quote_amount_php"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={
                            row.quote_amount_cents != null
                              ? (row.quote_amount_cents / 100).toString()
                              : ""
                          }
                          className="input input-bordered bg-base-100"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                          Currency
                        </span>
                        <input
                          name="quote_currency"
                          defaultValue={row.quote_currency || "PHP"}
                          className="input input-bordered bg-base-100"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                          Quote expires
                        </span>
                        <input
                          name="quote_expires_on"
                          type="date"
                          defaultValue={row.quote_expires_on ?? ""}
                          className="input input-bordered bg-base-100"
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="border border-base-content/35 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
                    >
                      Save update
                    </button>
                  </div>
                </form>

                <form action={convertCustomRequestToBooking} className="border border-primary/20 bg-primary/5 p-4">
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="preferred_date" value={row.preferred_date ?? ""} />
                  <input type="hidden" name="preferred_time" value={row.preferred_time ?? ""} />
                  <input type="hidden" name="special_requests" value={row.request_details} />
                  <p className="text-[10px] uppercase tracking-[0.28em] text-primary">
                    Convert to booking
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                        Activity
                      </span>
                      <select
                        name="activity_id"
                        defaultValue=""
                        className="select select-bordered bg-base-100"
                        required
                      >
                        <option value="" disabled>
                          Select activity
                        </option>
                        {activities.map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {activity.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                        Location
                      </span>
                      <select
                        name="location_id"
                        defaultValue={row.location_id ?? ""}
                        className="select select-bordered bg-base-100"
                      >
                        <option value="">No preference</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                        Employee
                      </span>
                      <select
                        name="employee_id"
                        defaultValue={row.employee_id ?? ""}
                        className="select select-bordered bg-base-100"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={row.status === "converted"}
                      className="bg-primary px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90 disabled:opacity-50"
                    >
                      Create booking from request
                    </button>
                  </div>
                </form>
              </div>
            </article>
          );
        })}
        {requests.length === 0 && (
          <div className="border border-base-content/10 bg-base-100 py-16 text-center text-sm text-base-content/60">
            No custom requests yet.
          </div>
        )}
        <AdminPagination
          path="/admin/custom-bookings"
          page={page}
          pageSize={ADMIN_LIST_PAGE_SIZE}
          total={total}
          query={{}}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "new" | "quoted" | "approved" | "rejected" | "converted";
}) {
  const styles: Record<typeof status, string> = {
    new: "bg-info/20 text-info-content border-info/40",
    quoted: "bg-warning/20 text-warning-content border-warning/40",
    approved: "bg-success/20 text-success-content border-success/40",
    rejected: "bg-error/20 text-error-content border-error/40",
    converted: "bg-primary/20 text-primary border-primary/40",
  };
  return (
    <span
      className={`inline-flex items-center border px-2 py-1 text-[10px] uppercase tracking-[0.28em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}
