import { NextResponse } from "next/server";
import { getClientForBookingDocuments } from "@/lib/booking-document-access";
import { buildQuotationPdf } from "@/lib/quotation-pdf";

type Params = { reference: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { reference } = await params;
  const normalizedReference = decodeURIComponent(reference);

  const access = await getClientForBookingDocuments();
  if (!access) {
    return NextResponse.json(
      {
        error:
          "Sign in as admin (same browser) or add SUPABASE_SERVICE_ROLE_KEY to .env.local to download quotations.",
      },
      { status: 401 },
    );
  }

  const { client: supabase } = access;

  const [{ data: booking, error: bookingError }, { data: settings }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          "reference, customer_name, customer_email, party_size, payment_status, quoted_total_cents, quoted_currency, amount_paid_cents, activity:activities(name, price_cents)",
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

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  const b = booking as
    | {
        reference: string;
        customer_name: string;
        customer_email: string;
        party_size: number;
        payment_status: "unpaid" | "partial" | "paid" | "refunded";
        quoted_total_cents: number;
        quoted_currency: string;
        amount_paid_cents: number;
        activity?:
          | { name?: string | null; price_cents?: number | null }
          | Array<{ name?: string | null; price_cents?: number | null }>
          | null;
      }
    | null;

  if (!b) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if ((b.quoted_total_cents ?? 0) <= 0) {
    return NextResponse.json({ error: "Quotation not generated yet." }, { status: 403 });
  }

  const activity = Array.isArray(b.activity) ? b.activity[0] : b.activity;
  const activityName = activity?.name;
  const pricePerPersonCents =
    activity && typeof activity.price_cents === "number" ? activity.price_cents : null;

  const pdf = await buildQuotationPdf({
    customerName: b.customer_name,
    customerEmail: b.customer_email,
    activityName: activityName || "Activity",
    partySize: b.party_size,
    quotedTotalCents: b.quoted_total_cents,
    quotedCurrency: b.quoted_currency || "PHP",
    amountPaidCents: b.amount_paid_cents ?? 0,
    paymentStatus: b.payment_status,
    pricePerPersonCents,
    businessName:
      (settings as { business_name?: string } | null)?.business_name ??
      "DiveScotty",
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quotation-${b.reference}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
