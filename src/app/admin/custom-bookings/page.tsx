import Link from "next/link";
import {
  AlignLeft,
  Anchor,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock,
  Coins,
  ExternalLink,
  GitFork,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Save,
  Sparkles,
  StickyNote,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  convertCustomRequestToBooking,
  updateCustomBookingRequest,
} from "@/app/actions/custom-bookings";
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminPagination,
} from "@/components/admin/AdminPagination";
import { createClient } from "@/lib/supabase/server";
import { PhpMoneyInput } from "@/components/ui/PhpMoneyInput";
import { formatDate, formatMoneyCents } from "@/lib/utils";

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

type CustomStatus = CustomRequestRow["status"];

const STATUS_OPTIONS: CustomStatus[] = [
  "new",
  "quoted",
  "approved",
  "rejected",
  "converted",
];

const STATUS_LABEL: Record<CustomStatus, string> = {
  new: "New",
  quoted: "Quoted",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted",
};

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
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 border-b border-base-content/10 pb-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
              Sales pipeline
            </p>
            <h1 className="font-display mt-2 text-4xl uppercase">
              Custom bookings
            </h1>
            <p className="mt-2 max-w-xl text-sm text-base-content/65">
              Bespoke trip requests submitted through the public form. Quote,
              assign, and convert approved ones into confirmed bookings.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/55">
            {total} {total === 1 ? "request" : "requests"}
          </p>
          <Link
            href="/contact"
            target="_blank"
            className="inline-flex items-center gap-2 border border-base-content/15 bg-base-100 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-base-content/75 transition hover:border-primary/40 hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Open customer form
          </Link>
        </div>
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
            <RequestCard
              key={row.id}
              row={row}
              locationName={locationName ?? null}
              employeeName={employeeName ?? null}
              bookingReference={bookingReference ?? null}
              activities={activities}
              locations={locations}
              employees={employees}
            />
          );
        })}
        {requests.length === 0 && (
          <div className="border border-dashed border-base-content/20 bg-base-200/30 py-16 text-center text-sm text-base-content/65">
            <p className="font-display text-base uppercase tracking-[0.22em]">
              No custom requests yet
            </p>
            <p className="mt-2 text-xs text-base-content/55">
              New submissions will appear here as soon as customers send them.
            </p>
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

function RequestCard({
  row,
  locationName,
  employeeName,
  bookingReference,
  activities,
  locations,
  employees,
}: {
  row: CustomRequestRow;
  locationName: string | null;
  employeeName: string | null;
  bookingReference: string | null;
  activities: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string }>;
}) {
  const flexLabel = row.flexibility === "flexible" ? "Flexible dates" : "Fixed dates";
  return (
    <article className="border border-base-content/10 bg-base-100 shadow-sm">
      <header className="flex flex-col gap-4 border-b border-base-content/10 bg-base-200/40 p-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="font-mono text-[11px] text-base-content/55">
              {row.reference}
            </p>
            <h2 className="font-display mt-1 text-xl uppercase tracking-[0.18em]">
              {row.customer_name}
            </h2>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-base-content/65">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                {row.customer_email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                {row.customer_phone}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={row.status} />
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-base-content/10 px-5 py-3 text-[11px] text-base-content/70">
        <Chip
          icon={CalendarDays}
          label={row.preferred_date ? formatDate(row.preferred_date) : "No date"}
        />
        <Chip
          icon={Clock}
          label={row.preferred_time ? row.preferred_time : "No time"}
        />
        <Chip icon={Users} label={`Party ${row.party_size}`} />
        <Chip icon={GitFork} label={flexLabel} />
        <Chip
          icon={MapPin}
          label={locationName ?? "No preference"}
          dim={!locationName}
        />
        <Chip
          icon={User}
          label={employeeName ?? "Unassigned"}
          dim={!employeeName}
        />
      </div>

      <div className="p-5">
        <div className="border border-base-content/10 bg-base-200/30 p-4">
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-base-content/55">
            <AlignLeft className="h-3 w-3" strokeWidth={1.75} aria-hidden />
            Request details
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/85">
            {row.request_details}
          </p>
        </div>

        {(row.quote_amount_cents != null || row.quote_expires_on) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border border-base-content/10 bg-base-100 px-4 py-3 text-xs text-base-content/75">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.24em] text-base-content/55">
              <Coins className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              Quote
            </span>
            <span className="font-mono text-sm text-base-content">
              {row.quote_amount_cents != null
                ? formatMoneyCents(row.quote_amount_cents, row.quote_currency)
                : "Not set"}
            </span>
            {row.quote_expires_on ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-base-content/60">
                <CalendarClock className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                Expires {formatDate(row.quote_expires_on)}
              </span>
            ) : null}
          </div>
        )}

        {bookingReference ? (
          <div className="mt-3 inline-flex items-center gap-2 border border-success/30 bg-success/5 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-success">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Converted booking: {bookingReference}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UpdateForm row={row} employees={employees} />
          <ConvertForm
            row={row}
            activities={activities}
            locations={locations}
            employees={employees}
          />
        </div>
      </div>
    </article>
  );
}

function UpdateForm({
  row,
  employees,
}: {
  row: CustomRequestRow;
  employees: Array<{ id: string; name: string }>;
}) {
  return (
    <form
      action={updateCustomBookingRequest}
      data-loading-message="Updating request…"
      className="border border-base-content/10 bg-base-200/30 p-4"
    >
      <input type="hidden" name="id" value={row.id} />

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-base-content/55">
        <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        Admin update
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Field icon={CircleDot} label="Status">
          <select
            name="status"
            defaultValue={row.status}
            className="select select-bordered w-full bg-base-100"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={User} label="Assign employee">
          <select
            name="employee_id"
            defaultValue={row.employee_id ?? ""}
            className="select select-bordered w-full bg-base-100"
          >
            <option value="">Unassigned</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={AlignLeft} label="Admin notes">
          <textarea
            name="admin_notes"
            rows={3}
            defaultValue={row.admin_notes ?? ""}
            className="textarea textarea-bordered w-full bg-base-100"
            placeholder="Internal notes about this request…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PhpMoneyInput
            name="quote_amount_php"
            label="Quote amount"
            icon={<Coins className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
            defaultAmountPhp={
              row.quote_amount_cents != null ? row.quote_amount_cents / 100 : 0
            }
            emptyWhenZero
          />
          <Field icon={Hash} label="Currency">
            <input
              name="quote_currency"
              defaultValue={row.quote_currency || "PHP"}
              className="input input-bordered w-full bg-base-100"
            />
          </Field>
          <Field icon={CalendarClock} label="Quote expires">
            <input
              name="quote_expires_on"
              type="date"
              defaultValue={row.quote_expires_on ?? ""}
              className="input input-bordered w-full bg-base-100"
            />
          </Field>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-2 border border-base-content/30 bg-base-100 px-4 py-2 text-xs uppercase tracking-[0.28em] text-base-content transition hover:border-base-content hover:bg-base-content hover:text-base-100"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Save update
          </button>
        </div>
      </div>
    </form>
  );
}

function ConvertForm({
  row,
  activities,
  locations,
  employees,
}: {
  row: CustomRequestRow;
  activities: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string }>;
}) {
  const isConverted = row.status === "converted";
  return (
    <form
      action={convertCustomRequestToBooking}
      data-loading-message="Converting to booking…"
      className="border border-primary/30 bg-primary/5 p-4"
    >
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="preferred_date" value={row.preferred_date ?? ""} />
      <input type="hidden" name="preferred_time" value={row.preferred_time ?? ""} />
      <input type="hidden" name="special_requests" value={row.request_details} />

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-primary">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        Convert to booking
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-base-content/65">
        Pick the activity, location, and employee to turn this request into a
        confirmed booking. Date, time, and request details carry over.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Field icon={Anchor} label="Activity">
          <select
            name="activity_id"
            defaultValue=""
            className="select select-bordered w-full bg-base-100"
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
        </Field>

        <Field icon={MapPin} label="Location">
          <select
            name="location_id"
            defaultValue={row.location_id ?? ""}
            className="select select-bordered w-full bg-base-100"
          >
            <option value="">No preference</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={User} label="Employee">
          <select
            name="employee_id"
            defaultValue={row.employee_id ?? ""}
            className="select select-bordered w-full bg-base-100"
          >
            <option value="">Unassigned</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col gap-2 pt-1 md:flex-row md:items-center md:justify-between">
          {isConverted ? (
            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.24em] text-success">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              Already converted
            </p>
          ) : (
            <span className="text-[11px] text-base-content/55">
              A new booking with status <strong>confirmed</strong> will be created.
            </span>
          )}
          <button
            type="submit"
            disabled={isConverted}
            className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-primary-content shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Create booking
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({
  icon: Icon,
  label,
  dim,
}: {
  icon: LucideIcon;
  label: string;
  dim?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-base-content/10 bg-base-100 px-2.5 py-1 text-[11px] ${
        dim ? "text-base-content/50" : "text-base-content/75"
      }`}
    >
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: CustomStatus }) {
  const styles: Record<CustomStatus, string> = {
    new: "bg-info/15 text-info border-info/40",
    quoted: "bg-warning/15 text-warning border-warning/40",
    approved: "bg-success/15 text-success border-success/40",
    rejected: "bg-error/15 text-error border-error/40",
    converted: "bg-primary/15 text-primary border-primary/40",
  };
  const Icon: LucideIcon =
    status === "new"
      ? CircleDot
      : status === "quoted"
        ? Coins
        : status === "approved"
          ? CheckCircle2
          : status === "rejected"
            ? GitFork
            : Sparkles;
  return (
    <span
      className={`inline-flex items-center gap-1.5 self-start border px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${styles[status]}`}
    >
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
