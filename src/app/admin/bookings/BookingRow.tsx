"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { updateBookingStatus } from "@/app/actions/bookings";
import type { BookingStatus } from "@/lib/supabase/database.types";
import { formatPricePHP } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface BookingRowData {
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
  activity_name: string | null;
  activity_price_cents: number | null;
  template_fuel_cost_cents: number;
  template_fuel_hourly_cost_cents: number;
  template_tank_cost_cents: number;
  template_tank_qty: number;
  template_tank_unit_cost_cents: number;
  template_gear_cost_cents: number;
  template_gear_qty: number;
  template_gear_unit_cost_cents: number;
  template_other_cost_cents: number;
  template_instructor_hours: number;
  location_name: string | null;
  employee_id: string | null;
  employee_name: string | null;
  employee_code: string | null;
  employee_role: string | null;
  employee_photo: string | null;
  employee_phone: string | null;
  employee_email: string | null;
}

interface BookingRowProps {
  booking: BookingRowData;
  preferredDateLabel: string;
  createdLabel: string;
  employees: Array<{
    id: string;
    name: string;
    employee_code: string;
    role: string;
    photo_url: string | null;
    phone: string | null;
    email: string | null;
  }>;
}

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];
const PAYMENT_STATUS_OPTIONS = ["unpaid", "partial", "paid", "refunded"] as const;

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-warning/20 text-warning-content border-warning/40",
  confirmed: "bg-success/20 text-success-content border-success/40",
  completed: "bg-info/20 text-info-content border-info/40",
  cancelled: "bg-error/20 text-error-content border-error/40",
};

const PAYMENT_STYLES: Record<BookingRowData["payment_status"], string> = {
  unpaid: "bg-base-200 text-base-content/80 border-base-content/25",
  partial: "bg-warning/15 text-warning-content border-warning/35",
  paid: "bg-success/15 text-success-content border-success/35",
  refunded: "bg-base-300 text-base-content/70 border-base-content/30",
};

export function BookingRow({
  booking,
  preferredDateLabel,
  createdLabel,
  employees,
}: BookingRowProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const systemQuoteCents = Math.max(
    0,
    booking.party_size * (booking.activity_price_cents ?? 0),
  );
  const quotationTotalCents = Math.max(0, booking.quoted_total_cents);
  const expenditureTotalCents = Math.max(0, booking.total_cost_cents);
  const surplusFromQuotationCents = quotationTotalCents - expenditureTotalCents;
  const tankQtyDefault = booking.tank_qty > 0 ? booking.tank_qty : booking.template_tank_qty;
  const tankUnitPhpDefault =
    booking.tank_unit_cost_cents > 0
      ? booking.tank_unit_cost_cents / 100
      : booking.template_tank_unit_cost_cents / 100;
  const gearQtyDefault = booking.gear_qty > 0 ? booking.gear_qty : booking.template_gear_qty;
  const gearUnitPhpDefault =
    booking.gear_unit_cost_cents > 0
      ? booking.gear_unit_cost_cents / 100
      : booking.template_gear_unit_cost_cents / 100;
  const otherPhpDefault =
    booking.other_cost_cents > 0
      ? booking.other_cost_cents / 100
      : booking.template_other_cost_cents / 100;

  const isCancelled = booking.status === "cancelled";

  useEffect(() => {
    if (isCancelled) setOpen(false);
  }, [isCancelled]);

  return (
    <>
      <tr id={booking.id} className="border-t border-base-content/10">
        <td className="font-mono text-xs">{booking.reference}</td>
        <td>
          {isCancelled ? (
            <div className="text-sm text-base-content/50 italic">Withheld (cancelled)</div>
          ) : (
            <>
              <div className="font-medium">{booking.customer_name}</div>
              <div className="text-xs text-base-content/60">{booking.customer_email}</div>
            </>
          )}
        </td>
        <td>{booking.activity_name ?? "—"}</td>
        <td>{booking.party_size}</td>
        <td>{preferredDateLabel}</td>
        <td className="text-xs text-base-content/60">{createdLabel}</td>
        <td>
          <span
            className={`inline-flex items-center border px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] ${STATUS_STYLES[booking.status]}`}
          >
            {booking.status}
          </span>
        </td>
        <td>
          {isCancelled ? (
            <span className="text-xs text-base-content/45">—</span>
          ) : (
            <span
              className={`inline-flex items-center border px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] ${PAYMENT_STYLES[booking.payment_status]}`}
            >
              {booking.payment_status}
            </span>
          )}
        </td>
        <td>
          {isCancelled ? (
            <span className="text-xs uppercase tracking-[0.28em] text-base-content/45">
              Locked
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.28em] hover:text-primary"
              aria-expanded={open}
            >
              {open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {open ? "Close" : "Open"}
            </button>
          )}
        </td>
      </tr>

      {open && !isCancelled && (
        <tr className="border-t border-base-content/10 bg-base-200/40">
          <td colSpan={9} className="p-6">
            <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-base-content/10 pb-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                Customer links
              </p>
              <Link
                href={`/booking/confirmation/${booking.reference}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border border-base-content/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] hover:bg-base-content hover:text-base-100"
              >
                Confirmation
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href={`/booking/confirmation/${booking.reference}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border border-base-content/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] hover:bg-base-content hover:text-base-100"
              >
                PDF
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href={`/booking/confirmation/${booking.reference}/quote`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border border-base-content/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] hover:bg-base-content hover:text-base-100"
              >
                Quote
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <form
              action={(formData) =>
                startTransition(() => updateBookingStatus(formData))
              }
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              <input type="hidden" name="id" value={booking.id} />

              <div className="space-y-3">
                <ReadonlyField label="Phone" value={booking.customer_phone} />
                <ReadonlyField
                  label="Preferred time"
                  value={booking.preferred_time ?? "Flexible"}
                />
                <ReadonlyField
                  label="Location"
                  value={booking.location_name ?? "No preference"}
                />
                <ReadonlyField
                  label="Assigned employee"
                  value={
                    booking.employee_name
                      ? `${booking.employee_name} (${booking.employee_code ?? "N/A"})`
                      : "Unassigned"
                  }
                />
                <ReadonlyField label="Role" value={booking.employee_role ?? "N/A"} />
                <ReadonlyField label="Employee phone" value={booking.employee_phone ?? "N/A"} />
                <ReadonlyField label="Employee email" value={booking.employee_email ?? "N/A"} />

                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                    Special requests
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm">
                    {booking.special_requests ?? "—"}
                  </p>
                </div>
                <div className="mt-2 rounded border border-base-content/10 bg-base-100 p-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                    Financial preview
                  </p>
                  <p className="mt-2 text-xs text-base-content/70">
                    Quotation formula: party ({booking.party_size}) × price per person (
                    {formatPricePHP(booking.activity_price_cents ?? 0)})
                  </p>
                  <div className="mt-3 border-b border-base-content/10 pb-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                      Total (quotation)
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight">
                      {formatPricePHP(quotationTotalCents)}
                      {booking.quoted_currency && booking.quoted_currency !== "PHP" ? (
                        <span className="ml-2 text-sm font-normal text-base-content/60">
                          {booking.quoted_currency}
                        </span>
                      ) : null}
                    </p>
                    {booking.quoted_total_cents !== systemQuoteCents ? (
                      <p className="mt-1 text-xs text-base-content/60">
                        Live system total {formatPricePHP(systemQuoteCents)} — save the booking to
                        align the saved quotation.
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                      Expenditure
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-base-content/80">
                      <li className="flex justify-between gap-4">
                        <span>Fuel</span>
                        <span>{formatPricePHP(booking.fuel_cost_cents)}</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span>Tank</span>
                        <span>{formatPricePHP(booking.tank_cost_cents)}</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span>Gear</span>
                        <span>{formatPricePHP(booking.gear_cost_cents)}</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span>Other</span>
                        <span>{formatPricePHP(booking.other_cost_cents)}</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span>Instructor payout</span>
                        <span>{formatPricePHP(booking.instructor_payout_cents)}</span>
                      </li>
                    </ul>
                    <p className="mt-2 flex justify-between gap-4 border-t border-base-content/10 pt-2 text-sm font-semibold">
                      <span>Total expenditure</span>
                      <span>{formatPricePHP(expenditureTotalCents)}</span>
                    </p>
                  </div>
                  <p className="mt-3 text-sm">
                    Profit (quotation − expenditure):{" "}
                    <span className="font-semibold">
                      {formatPricePHP(surplusFromQuotationCents)}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-base-content/60">
                    Instructor hours (and fuel by the hour) follow start/end time and assigned
                    employee expertise.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                    Status
                  </span>
                  <select
                    name="status"
                    defaultValue={booking.status}
                    className="select select-bordered bg-base-100"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                    Employee
                  </span>
                  <select
                    name="employee_id"
                    defaultValue={booking.employee_id ?? ""}
                    className="select select-bordered bg-base-100"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employee_code}) - {employee.role}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                    Internal notes (admin-only)
                  </span>
                  <textarea
                    name="internal_notes"
                    rows={4}
                    defaultValue={booking.internal_notes ?? ""}
                    className="textarea textarea-bordered bg-base-100"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ReadonlyField
                    label="Live quotation (formula)"
                    value={formatPricePHP(systemQuoteCents)}
                  />
                  <ReadonlyField
                    label="Quote currency"
                    value={booking.quoted_currency || "PHP"}
                  />
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                      Payment status (mock)
                    </span>
                    <select
                      name="payment_status"
                      defaultValue={booking.payment_status}
                      className="select select-bordered bg-base-100"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <InputField
                    label="Amount paid (PHP)"
                    name="amount_paid_php"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={(booking.amount_paid_cents / 100).toString()}
                  />
                  <InputField
                    label="Payment method (mock)"
                    name="payment_method_mock"
                    defaultValue={booking.payment_method_mock ?? ""}
                  />
                  <InputField
                    label="Paid date"
                    name="paid_at_date"
                    type="date"
                    defaultValue={toDateOnly(booking.paid_at)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ReadonlyField
                    label="Fuel cost (auto)"
                    value={`${formatPricePHP(booking.fuel_cost_cents)} (${formatPricePHP(
                      booking.template_fuel_hourly_cost_cents,
                    )}/hr x ${booking.instructor_hours}h)`}
                  />
                  <ReadonlyField
                    label="Tank pieces (from settings)"
                    value={String(tankQtyDefault)}
                  />
                  <ReadonlyField
                    label="Tank unit cost (from settings)"
                    value={formatPricePHP(Math.round(tankUnitPhpDefault * 100))}
                  />
                  <ReadonlyField
                    label="Gear pieces (from settings)"
                    value={String(gearQtyDefault)}
                  />
                  <ReadonlyField
                    label="Gear unit cost (from settings)"
                    value={formatPricePHP(Math.round(gearUnitPhpDefault * 100))}
                  />
                  <ReadonlyField
                    label="Tank total (auto)"
                    value={formatPricePHP(booking.tank_cost_cents)}
                  />
                  <ReadonlyField
                    label="Gear total (auto)"
                    value={formatPricePHP(booking.gear_cost_cents)}
                  />
                  <InputField
                    label="Other costs (PHP)"
                    name="other_cost_php"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={otherPhpDefault.toString()}
                  />
                  <ReadonlyField
                    label="Instructor hours (auto)"
                    value={`${booking.instructor_hours}h (from start/end time + expertise)`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-3 bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90 disabled:opacity-60"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function toDateOnly(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function InputField({
  label,
  ...rest
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input className="input input-bordered bg-base-100" {...rest} />
    </label>
  );
}
