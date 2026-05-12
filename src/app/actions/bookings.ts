"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookingFormSchema } from "@/lib/validators";
import { sendBookingConfirmationEmail } from "@/lib/booking-confirmation-email";

export interface CreateBookingState {
  ok?: boolean;
  reference?: string;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

export async function createBooking(
  _prevState: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const raw = {
    activityId: String(formData.get("activityId") ?? ""),
    employeeId: (formData.get("employeeId") as string | null) || null,
    locationId: (formData.get("locationId") as string | null) || null,
    customerName: String(formData.get("customerName") ?? ""),
    customerEmail: String(formData.get("customerEmail") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    partySize: Number(formData.get("partySize") ?? 2),
    preferredDate: String(formData.get("preferredDate") ?? ""),
    preferredTime: (formData.get("preferredTime") as string | null) ?? "",
    preferredTimeEnd: (formData.get("preferredTimeEnd") as string | null) ?? "",
    specialRequests: (formData.get("specialRequests") as string | null) ?? "",
  };

  const parsed = bookingFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const data = parsed.data;
  const supabase = await createClient();
  const mergedSpecialRequests = [
    data.specialRequests?.trim() || "",
    data.preferredTimeEnd ? `End time: ${data.preferredTimeEnd}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const insert = await supabase.rpc("create_booking_request", {
    p_activity_id: data.activityId,
    p_employee_id: data.employeeId || null,
    p_location_id: data.locationId || null,
    p_customer_name: data.customerName,
    p_customer_email: data.customerEmail,
    p_customer_phone: data.customerPhone,
    p_party_size: data.partySize,
    p_preferred_date: data.preferredDate,
    p_preferred_time: data.preferredTime || null,
    p_special_requests: mergedSpecialRequests || null,
  });

  const reference = insert.data as string | null;
  if (insert.error || !reference) {
    return {
      ok: false,
      formError:
        insert.error?.message ??
        "Something went wrong submitting your request. Please try again.",
    };
  }

  const [{ data: activityRow }, { data: locationRow }] = await Promise.all([
    supabase
      .from("activities")
      .select("name")
      .eq("id", data.activityId)
      .maybeSingle(),
    data.locationId
      ? supabase
          .from("locations")
          .select("name")
          .eq("id", data.locationId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  try {
    await sendBookingConfirmationEmail({
      bookingReference: reference,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      activityName: activityRow?.name ?? "Scuba activity",
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime || null,
      preferredTimeEnd: data.preferredTimeEnd || null,
      partySize: data.partySize,
      locationName: locationRow?.name ?? null,
      specialRequests: mergedSpecialRequests || null,
      bookingStatusLabel: "Pending",
    });
  } catch (emailError) {
    // Booking succeeded; do not block customer flow if email fails.
    console.error("Booking confirmation email failed", emailError);
  }

  revalidatePath("/admin/bookings");
  redirect(`/booking/confirmation/${reference}`);
}

export async function updateBookingStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const internalNotes = String(formData.get("internal_notes") ?? "");
  const employeeId = String(formData.get("employee_id") ?? "");
  const preferredTimeRaw = formData.get("preferred_time");
  const preferredTimeEndRaw = formData.get("preferred_time_end");
  const currentSpecialRequests = String(formData.get("current_special_requests") ?? "");
  const paymentStatusRaw = String(formData.get("payment_status") ?? "unpaid").trim();
  const amountPaidPhpRaw = String(formData.get("amount_paid_php") ?? "").trim();
  const paymentMethodMock =
    String(formData.get("payment_method_mock") ?? "").trim() || null;
  const paidAtDateRaw = String(formData.get("paid_at_date") ?? "").trim();
  const otherCostPhpRaw = String(formData.get("other_cost_php") ?? "").trim();

  if (!id || !status) {
    throw new Error("Missing booking id or status");
  }

  const normalizeTime = (value: FormDataEntryValue | null) => {
    if (value == null) return null;
    const str = String(value).trim();
    return str === "" ? null : str;
  };
  const stripEndTimeTag = (text: string) =>
    text
      .replace(/(?:^|\|)\s*End time:\s*[0-2]\d:[0-5]\d(?:[:][0-5]\d)?\s*(?=\||$)/gi, "")
      .replace(/\s*\|\s*/g, " | ")
      .replace(/^ \| | \| $/g, "")
      .trim();
  const withEndTimeTag = (base: string, endTime: string | null) => {
    const clean = stripEndTimeTag(base);
    if (!endTime) return clean || null;
    return clean ? `${clean} | End time: ${endTime}` : `End time: ${endTime}`;
  };
  const parseEndTimeTag = (text: string | null) => {
    if (!text) return null;
    const match = text.match(
      /(?:^|\|)\s*End time:\s*([0-2]\d:[0-5]\d(?:[:][0-5]\d)?)\s*(?:\||$)/i,
    );
    return match?.[1] ?? null;
  };
  const timeToMinutes = (value: string | null) => {
    if (!value) return null;
    const [hh, mm] = value.split(":");
    if (!hh || !mm) return null;
    return Number(hh) * 60 + Number(mm);
  };
  const toCents = (raw: string) =>
    raw === "" ? 0 : Math.round(Math.max(0, Number(raw) || 0) * 100);
  const supabase = await createClient();
  const bookingRes = await supabase
    .from("bookings")
    .select(
      "status, activity_id, party_size, preferred_time, special_requests, activity:activities(price_cents)",
    )
    .eq("id", id)
    .maybeSingle();
  if (bookingRes.error) throw bookingRes.error;
  const existing = bookingRes.data as
    | {
        status: "pending" | "confirmed" | "cancelled" | "completed";
        activity_id: string;
        party_size: number;
        preferred_time: string | null;
        special_requests: string | null;
        activity?:
          | { price_cents?: number | null }
          | Array<{ price_cents?: number | null }>
          | null;
      }
    | null;
  if (!existing) throw new Error("Booking not found.");
  if (existing.status === "cancelled") {
    throw new Error("Cancelled bookings cannot be edited.");
  }

  const templateRes = await supabase
    .from("activity_cost_templates")
    .select(
      "default_fuel_hourly_cost_cents, default_instructor_hours, default_tank_qty, default_tank_unit_cost_cents, default_gear_qty, default_gear_unit_cost_cents, default_other_cost_cents",
    )
    .eq("activity_id", existing.activity_id)
    .maybeSingle();
  if (templateRes.error) throw templateRes.error;
  const template = (templateRes.data as {
    default_fuel_hourly_cost_cents?: number | null;
    default_instructor_hours?: number | null;
    default_tank_qty?: number | null;
    default_tank_unit_cost_cents?: number | null;
    default_gear_qty?: number | null;
    default_gear_unit_cost_cents?: number | null;
    default_other_cost_cents?: number | null;
  } | null) ?? null;

  const employeeRes = employeeId
    ? await supabase
        .from("employees")
        .select(
          "payout_mode, payout_percent, hourly_rate_cents, overtime_hourly_rate_cents, expertise_level",
        )
        .eq("id", employeeId)
        .maybeSingle()
    : { data: null, error: null };
  if (employeeRes.error) throw employeeRes.error;
  const employee = employeeRes.data as
    | {
        payout_mode?: "percent" | "hourly" | null;
        payout_percent?: number | null;
        hourly_rate_cents?: number | null;
        overtime_hourly_rate_cents?: number | null;
        expertise_level?: string | null;
      }
    | null;

  const nextPreferredTime =
    preferredTimeRaw !== null ? normalizeTime(preferredTimeRaw) : existing.preferred_time;
  const nextSpecialRequests =
    preferredTimeEndRaw !== null
      ? withEndTimeTag(currentSpecialRequests, normalizeTime(preferredTimeEndRaw))
      : currentSpecialRequests || existing.special_requests;
  const endTime = parseEndTimeTag(nextSpecialRequests);
  const startMins = timeToMinutes(nextPreferredTime);
  const endMins = timeToMinutes(endTime);
  const baseHours =
    startMins != null && endMins != null && endMins > startMins
      ? (endMins - startMins) / 60
      : Math.max(0, Number(template?.default_instructor_hours ?? 0) || 0);
  const rawBaseHours = Math.min(baseHours > 0 ? baseHours : 0, 24);
  const expertiseMultiplier = (() => {
    const level = (employee?.expertise_level ?? "").toLowerCase();
    if (level === "intermediate") return 1.05;
    if (level === "advanced") return 1.1;
    if (level === "technical") return 1.2;
    return 1;
  })();
  const instructorHours = Number((rawBaseHours * expertiseMultiplier).toFixed(2));

  const activity = Array.isArray(existing.activity)
    ? existing.activity[0]
    : existing.activity;
  const pricePerPersonCents = activity?.price_cents ?? 0;
  const revenueCents = Math.max(0, existing.party_size * pricePerPersonCents);

  const fuelHourlyRateCents = Math.max(
    0,
    Number(template?.default_fuel_hourly_cost_cents ?? 0) || 0,
  );
  const fuelCostCents = Math.round(instructorHours * fuelHourlyRateCents);
  const tankQty = Math.max(0, Number(template?.default_tank_qty ?? 0) || 0);
  const tankUnitCostCents = Math.max(
    0,
    Number(template?.default_tank_unit_cost_cents ?? 0) || 0,
  );
  const tankCostCents = Math.round(tankQty * tankUnitCostCents);
  const gearQty = Math.max(0, Number(template?.default_gear_qty ?? 0) || 0);
  const gearUnitCostCents = Math.max(
    0,
    Number(template?.default_gear_unit_cost_cents ?? 0) || 0,
  );
  const gearCostCents = Math.round(gearQty * gearUnitCostCents);
  const otherCostCents = toCents(
    otherCostPhpRaw || String((template?.default_other_cost_cents ?? 0) / 100),
  );
  const quotedTotalCents = revenueCents;
  const amountPaidCents = toCents(amountPaidPhpRaw);
  const paymentStatus = (
    ["unpaid", "partial", "paid", "refunded"].includes(paymentStatusRaw)
      ? paymentStatusRaw
      : "unpaid"
  ) as "unpaid" | "partial" | "paid" | "refunded";

  let instructorPayoutCents = 0;
  if (employeeId && employee) {
    if (employee.payout_mode === "hourly") {
      const baseRate = Math.max(0, employee.hourly_rate_cents ?? 0);
      const overtimeRate = Math.max(0, employee.overtime_hourly_rate_cents ?? baseRate);
      const regularHours = Math.min(instructorHours, 4);
      const overtimeHours = Math.max(0, instructorHours - 4);
      instructorPayoutCents = Math.round(
        regularHours * baseRate + overtimeHours * overtimeRate,
      );
    } else {
      const percent = Math.max(0, Math.min(100, employee.payout_percent ?? 30));
      instructorPayoutCents = Math.round((quotedTotalCents * percent) / 100);
    }
  }

  const totalCostCents =
    fuelCostCents + tankCostCents + gearCostCents + otherCostCents + instructorPayoutCents;
  const estimatedProfitCents = quotedTotalCents - totalCostCents;
  const paidAt = (() => {
    if (paymentStatus !== "paid") return null;
    if (paidAtDateRaw) return `${paidAtDateRaw}T09:00:00.000Z`;
    return new Date().toISOString();
  })();

  const payload: {
    status: "pending" | "confirmed" | "cancelled" | "completed";
    internal_notes: string | null;
    employee_id: string | null;
    preferred_time?: string | null;
    special_requests?: string | null;
    quoted_total_cents: number;
    quoted_currency: string;
    payment_status: "unpaid" | "partial" | "paid" | "refunded";
    amount_paid_cents: number;
    payment_method_mock: string | null;
    paid_at: string | null;
    fuel_cost_cents: number;
    tank_cost_cents: number;
    gear_cost_cents: number;
    other_cost_cents: number;
    instructor_hours: number;
    instructor_payout_cents: number;
    total_cost_cents: number;
    estimated_profit_cents: number;
  } = {
    status: status as "pending" | "confirmed" | "cancelled" | "completed",
    internal_notes: internalNotes || null,
    employee_id: employeeId || null,
    quoted_total_cents: quotedTotalCents,
    quoted_currency: "PHP",
    payment_status: paymentStatus,
    amount_paid_cents: amountPaidCents,
    payment_method_mock: paymentMethodMock,
    paid_at: paidAt,
    fuel_cost_cents: fuelCostCents,
    tank_cost_cents: tankCostCents,
    tank_qty: tankQty,
    tank_unit_cost_cents: tankUnitCostCents,
    gear_cost_cents: gearCostCents,
    gear_qty: gearQty,
    gear_unit_cost_cents: gearUnitCostCents,
    other_cost_cents: otherCostCents,
    instructor_hours: instructorHours,
    instructor_payout_cents: instructorPayoutCents,
    total_cost_cents: totalCostCents,
    estimated_profit_cents: estimatedProfitCents,
  };

  if (preferredTimeRaw !== null) {
    payload.preferred_time = normalizeTime(preferredTimeRaw);
  }
  if (preferredTimeEndRaw !== null) {
    payload.special_requests = withEndTimeTag(
      currentSpecialRequests,
      normalizeTime(preferredTimeEndRaw),
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update(payload)
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}
