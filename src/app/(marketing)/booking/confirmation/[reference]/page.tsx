import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Download, Mail, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { BookingStatus } from "@/lib/supabase/database.types";

interface RouteParams {
  reference: string;
}

export const metadata = {
  title: "Booking confirmation",
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { reference } = await params;
  const normalizedRef = decodeURIComponent(reference.trim());
  const encodedReference = encodeURIComponent(normalizedRef);

  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc(
    "get_booking_confirmation_by_reference",
    { p_reference: normalizedRef },
  );

  if (error || !rows?.length) {
    notFound();
  }

  const booking = rows[0]!;
  const status = booking.status as BookingStatus;
  const paymentStatus = booking.payment_status ?? "unpaid";

  const canDownloadQuotation = (booking.quoted_total_cents ?? 0) > 0;
  const canDownloadPdf =
    (status === "confirmed" || status === "completed") && paymentStatus === "paid";

  const isCancelled = status === "cancelled";
  const isConfirmed = status === "confirmed" || status === "completed";
  const isPending = status === "pending";
  const isPaid = paymentStatus === "paid";

  let badge: { className: string; label: string };
  let title: string;
  let body: string;

  if (isCancelled) {
    badge = {
      className:
        "inline-flex items-center gap-3 border border-error/40 bg-error/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-error",
      label: "Booking cancelled",
    };
    title = "This trip is off the calendar.";
    body =
      "This reference is tied to a cancelled booking. If you think that is a mistake, email us with your reference and we will help.";
  } else if (isConfirmed && isPaid) {
    badge = {
      className:
        "inline-flex items-center gap-3 border border-success/40 bg-success/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-success",
      label: "Confirmed & paid",
    };
    title = "You are all set.";
    body = `We have recorded payment for ${booking.activity_name ?? "your activity"} on ${formatDate(booking.preferred_date)}. See you in the water — we will send any last-minute details to ${booking.customer_email}.`;
  } else if (isConfirmed) {
    badge = {
      className:
        "inline-flex items-center gap-3 border border-success/40 bg-success/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-success",
      label: "Booking confirmed",
    };
    title = "You are on the roster.";
    body = `Your booking for ${booking.activity_name ?? "this activity"} on ${formatDate(booking.preferred_date)} is confirmed. Payment status: ${paymentStatus}. If anything still needs to be settled, we will reach out at ${booking.customer_email}.`;
  } else {
    badge = {
      className:
        "inline-flex items-center gap-3 border border-success/40 bg-success/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-success",
      label: "Request received",
    };
    title = "See you in the water.";
    body =
      "Thanks — your booking request is in. Our team will be in touch within a few hours during business hours (Mactan, Cebu time) to confirm availability and arrange details.";
  }

  return (
    <section className="relative flex min-h-[100svh] items-center bg-base-100 pt-24">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className={badge.className}>
            <Check className="h-4 w-4" strokeWidth={2} />
            {badge.label}
          </div>

          <h1 className="h-display mt-8 text-[clamp(3rem,9vw,8rem)]">{title}</h1>

          <p className="mt-6 max-w-xl text-base text-base-content/75 md:text-lg">{body}</p>

          {!isCancelled && (isPending || (isConfirmed && !isPaid)) && (
            <p className="mt-4 max-w-xl text-sm text-base-content/60">
              Keep this page bookmarked — it updates when we confirm your booking and when payment
              is recorded.
            </p>
          )}

          <div className="mt-12 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3 border border-base-content/40 px-6 py-4 text-xs uppercase tracking-[0.32em] hover:bg-base-content hover:text-base-100"
            >
              Back to home
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="border border-base-content/15 bg-base-200/40 p-6 md:p-8">
            <p className="eyebrow">Your reference</p>
            <p className="mt-3 break-all font-display text-3xl uppercase tracking-wider text-primary">
              {normalizedRef}
            </p>
            <p className="mt-3 text-sm text-base-content/60">
              Quote this code in any follow-up message — it lets us pull up your request
              immediately.
            </p>

            <dl className="mt-6 space-y-2 border-t border-base-content/10 pt-6 text-sm text-base-content/80">
              <div className="flex justify-between gap-4">
                <dt>Activity</dt>
                <dd className="text-right font-medium text-base-content">
                  {booking.activity_name ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Date</dt>
                <dd className="text-right font-medium text-base-content">
                  {formatDate(booking.preferred_date)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Party</dt>
                <dd className="text-right font-medium text-base-content">{booking.party_size} pax</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd className="text-right font-medium uppercase tracking-wider text-base-content">
                  {status}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3">
              {canDownloadQuotation && (
                <a
                  href={`/booking/confirmation/${encodedReference}/quote`}
                  className="inline-flex items-center justify-center gap-3 border border-base-content/40 px-6 py-4 text-xs uppercase tracking-[0.32em] hover:bg-base-content hover:text-base-100"
                >
                  <Download className="h-4 w-4" strokeWidth={1.5} />
                  Download quotation slip
                </a>
              )}
              {canDownloadPdf ? (
                <a
                  href={`/booking/confirmation/${encodedReference}/pdf`}
                  className="inline-flex items-center justify-center gap-3 border border-base-content/40 px-6 py-4 text-xs uppercase tracking-[0.32em] hover:bg-base-content hover:text-base-100"
                >
                  <Download className="h-4 w-4" strokeWidth={1.5} />
                  Download booking PDF
                </a>
              ) : (
                !isCancelled && (
                  <div className="border border-base-content/20 bg-base-100 px-4 py-3 text-xs uppercase tracking-[0.2em] text-base-content/65">
                    {isConfirmed
                      ? "Confirmation PDF is available once payment is marked paid in our system."
                      : "Booking confirmation PDF is issued after we confirm your booking and record payment."}
                  </div>
                )
              )}
              <a
                href={`mailto:bookings@divescotty.com?subject=Booking%20${encodeURIComponent(normalizedRef)}`}
                className="inline-flex items-center justify-center gap-3 bg-primary px-6 py-4 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                Email us about this booking
              </a>
              <a
                href={`https://wa.me/639176312960?text=Hi%20Scotty's,%20booking%20${encodeURIComponent(normalizedRef)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-3 border border-base-content/40 px-6 py-4 text-xs uppercase tracking-[0.32em] hover:bg-base-content hover:text-base-100"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                Message us on WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
