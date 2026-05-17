"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { phpAmountToCents } from "@/lib/utils";
import { customBookingRequestSchema } from "@/lib/validators";
import { notifyAdminNewBooking } from "@/lib/admin-notifications";
import {
  redirectWithFlash,
  redirectWithFlashErrorFromCatch,
} from "@/lib/redirect-with-flash";

export interface CreateCustomBookingRequestState {
  ok?: boolean;
  reference?: string;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

export async function createCustomBookingRequest(
  _prevState: CreateCustomBookingRequestState,
  formData: FormData,
): Promise<CreateCustomBookingRequestState> {
  const raw = {
    customerName: String(formData.get("customerName") ?? ""),
    customerEmail: String(formData.get("customerEmail") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    preferredDate: String(formData.get("preferredDate") ?? ""),
    preferredTime: String(formData.get("preferredTime") ?? ""),
    partySize: Number(formData.get("partySize") ?? 2),
    locationId: (formData.get("locationId") as string | null) ?? "",
    budgetNotes: String(formData.get("budgetNotes") ?? ""),
    requestDetails: String(formData.get("requestDetails") ?? ""),
    flexibility: String(formData.get("flexibility") ?? "flexible"),
  };

  const parsed = customBookingRequestSchema.safeParse(raw);
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
  const insert = await supabase
    .from("custom_booking_requests")
    .insert(
      {
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        preferred_date: data.preferredDate || null,
        preferred_time: data.preferredTime || null,
        party_size: data.partySize,
        location_id: data.locationId || null,
        budget_notes: data.budgetNotes || null,
        request_details: data.requestDetails,
        flexibility: data.flexibility,
      } as never,
    )
    .select("reference")
    .maybeSingle();

  const insertRow = insert.data as { reference?: string } | null;
  if (insert.error || !insertRow?.reference) {
    return {
      ok: false,
      formError:
        insert.error?.message ??
        "Unable to submit custom request right now. Please try again.",
    };
  }

  revalidatePath("/admin/custom-bookings");
  const returnTo =
    String(formData.get("return_to") ?? "").trim() || "/custom-booking";
  redirectWithFlash(returnTo, "custom_request_submitted");
}

export async function updateCustomBookingRequest(formData: FormData) {
  const path = "/admin/custom-bookings";
  try {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "new");
  const employeeId = String(formData.get("employee_id") ?? "");
  const adminNotes = String(formData.get("admin_notes") ?? "");
  const quoteAmountRaw = String(formData.get("quote_amount_php") ?? "");
  const quoteCurrency = String(formData.get("quote_currency") ?? "PHP").trim() || "PHP";
  const quoteExpiresOn = String(formData.get("quote_expires_on") ?? "").trim();
  if (!id) throw new Error("Missing custom booking request id.");
  const quoteAmountCents =
    quoteAmountRaw === "" ? null : phpAmountToCents(quoteAmountRaw);

  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_booking_requests")
    .update(
      {
        status: status as "new" | "quoted" | "approved" | "rejected" | "converted",
        employee_id: employeeId || null,
        admin_notes: adminNotes || null,
        quote_amount_cents: quoteAmountCents,
        quote_currency: quoteCurrency,
        quote_expires_on: quoteExpiresOn || null,
      } as never,
    )
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/admin/custom-bookings");
  revalidatePath("/admin");
  redirectWithFlash(path, "custom_request_updated");
  } catch (err) {
    redirectWithFlashErrorFromCatch(
      path,
      err,
      "Could not update custom request.",
    );
  }
}

export async function convertCustomRequestToBooking(formData: FormData) {
  const path = "/admin/custom-bookings";
  try {
  const id = String(formData.get("id") ?? "");
  const activityId = String(formData.get("activity_id") ?? "");
  const employeeId = String(formData.get("employee_id") ?? "");
  const locationId = String(formData.get("location_id") ?? "");
  const preferredDate = String(formData.get("preferred_date") ?? "");
  const preferredTime = String(formData.get("preferred_time") ?? "");
  const specialRequests = String(formData.get("special_requests") ?? "");

  if (!id || !activityId) {
    throw new Error("Missing request id or selected activity.");
  }

  const supabase = await createClient();
  const requestRes = await supabase
    .from("custom_booking_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const request = requestRes.data as
    | {
        id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        party_size: number;
      }
    | null;

  if (requestRes.error || !request) {
    throw new Error(requestRes.error?.message ?? "Custom request not found.");
  }

  const bookingRpc = await supabase.rpc("create_booking_request", {
    p_activity_id: activityId,
    p_employee_id: employeeId || null,
    p_location_id: locationId || null,
    p_customer_name: request.customer_name,
    p_customer_email: request.customer_email,
    p_customer_phone: request.customer_phone,
    p_party_size: request.party_size,
    p_preferred_date: preferredDate || new Date().toISOString().slice(0, 10),
    p_preferred_time: preferredTime || null,
    p_special_requests: specialRequests || null,
  } as never);

  const reference = bookingRpc.data as string | null;
  if (bookingRpc.error || !reference) {
    throw new Error(
      bookingRpc.error?.message ?? "Failed to create booking from custom request.",
    );
  }

  const bookingLookup = await supabase
    .from("bookings")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();
  const bookingId = (bookingLookup.data as { id: string } | null)?.id ?? null;

  const updateReq = await supabase
    .from("custom_booking_requests")
    .update(
      {
        status: "converted",
        booking_id: bookingId,
        employee_id: employeeId || null,
        admin_notes: "Converted to booking",
      } as never,
    )
    .eq("id", id);
  if (updateReq.error) throw updateReq.error;

  const [{ data: activityRow }, { data: locationRow }] = await Promise.all([
    supabase.from("activities").select("name").eq("id", activityId).maybeSingle(),
    locationId
      ? supabase.from("locations").select("name").eq("id", locationId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  try {
    await notifyAdminNewBooking(supabase, {
      bookingReference: reference,
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      customerPhone: request.customer_phone,
      activityName: (activityRow as { name?: string } | null)?.name ?? "Activity",
      preferredDate: preferredDate || new Date().toISOString().slice(0, 10),
      preferredTime: preferredTime || null,
      partySize: request.party_size,
      locationName: (locationRow as { name?: string } | null)?.name ?? null,
      specialRequests: specialRequests || null,
      source: "custom_request",
    });
  } catch (notifyError) {
    console.error("Admin new booking notification failed", notifyError);
  }

  revalidatePath("/admin/custom-bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  redirectWithFlash(path, "custom_request_converted");
  } catch (err) {
    redirectWithFlashErrorFromCatch(
      path,
      err,
      "Could not convert custom request.",
    );
  }
}
