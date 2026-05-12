import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { buildBookingPdf } from "@/lib/booking-pdf";
import type { Database } from "@/lib/supabase/database.types";

type Params = { reference: string };

function getEndTime(specialRequests: string | null): string | null {
  if (!specialRequests) return null;
  const match = specialRequests.match(
    /(?:^|\|)\s*End time:\s*([0-2]\d:[0-5]\d(?:[:][0-5]\d)?)\s*(?:\||$)/i,
  );
  return match?.[1] ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { reference } = await params;
  const normalizedReference = decodeURIComponent(reference);
  const supabase = await createClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Missing Supabase server configuration." },
      { status: 500 },
    );
  }
  const adminSupabase = createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: booking, error: bookingError }, { data: settings }] = await Promise.all([
    adminSupabase
      .from("bookings")
      .select(
        "reference, status, payment_status, customer_name, customer_email, customer_phone, party_size, preferred_date, preferred_time, special_requests, quoted_total_cents, quoted_currency, amount_paid_cents, activity:activities(name, price_cents), location:locations(name), employee:employees(name)",
      )
      .eq("reference", normalizedReference)
      .maybeSingle(),
    supabase
      .from("site_settings")
      .select("business_name")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const b = (booking as
    | {
        reference: string;
        status: "pending" | "confirmed" | "cancelled" | "completed";
        payment_status: "unpaid" | "partial" | "paid" | "refunded";
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        party_size: number;
        preferred_date: string;
        preferred_time: string | null;
        special_requests: string | null;
        quoted_total_cents: number;
        quoted_currency: string;
        amount_paid_cents: number;
        activity?:
          | { name?: string | null; price_cents?: number | null }
          | Array<{ name?: string | null; price_cents?: number | null }>
          | null;
        location?: { name?: string | null } | Array<{ name?: string | null }> | null;
        employee?: { name?: string | null } | Array<{ name?: string | null }> | null;
      }
    | null);

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  if (!b) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (b.status !== "confirmed" && b.status !== "completed") {
    return NextResponse.json(
      { error: "PDF available only after payment confirmation." },
      { status: 403 },
    );
  }
  if (b.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Booking confirmation PDF requires paid status." },
      { status: 403 },
    );
  }

  const activity = Array.isArray(b.activity) ? b.activity[0] : b.activity;
  const activityName = activity?.name;
  const activityPriceCents =
    activity && typeof activity.price_cents === "number" ? activity.price_cents : null;
  const locationName = Array.isArray(b.location)
    ? b.location[0]?.name
    : b.location?.name;
  const assignedEmployeeName = Array.isArray(b.employee)
    ? b.employee[0]?.name
    : b.employee?.name;

  const statusLabel = b.status
    ? b.status.charAt(0).toUpperCase() + b.status.slice(1)
    : "Confirmed";

  const pdf = await buildBookingPdf({
    bookingReference: b.reference,
    customerName: b.customer_name,
    customerEmail: b.customer_email,
    customerPhone: b.customer_phone,
    activityName: activityName || "Activity",
    preferredDate: b.preferred_date,
    preferredTime: b.preferred_time,
    preferredTimeEnd: getEndTime(b.special_requests),
    partySize: b.party_size,
    locationName: locationName || null,
    assignedEmployeeName: assignedEmployeeName || null,
    specialRequests: b.special_requests,
    bookingStatusLabel: statusLabel,
    financial: {
      partySize: b.party_size,
      pricePerPersonCents: activityPriceCents,
      quotedTotalCents: b.quoted_total_cents,
      quotedCurrency: b.quoted_currency || "PHP",
      amountPaidCents: b.amount_paid_cents,
      paymentStatus: b.payment_status,
    },
    businessName:
      (settings as { business_name?: string } | null)?.business_name ??
      "DiveScotty",
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="booking-${b.reference}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
