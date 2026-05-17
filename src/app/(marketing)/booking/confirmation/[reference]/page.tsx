import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  Hourglass,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { BookingStatus } from "@/lib/supabase/database.types";

interface RouteParams {
  reference: string;
}

export const metadata = {
  title: "Booking confirmation",
};

type BadgeTone = "success" | "warning" | "error" | "info";

const BADGE_STYLES: Record<BadgeTone, string> = {
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  error: "border-error/40 bg-error/10 text-error",
  info: "border-info/40 bg-info/10 text-info",
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

  let badgeTone: BadgeTone;
  let badgeIcon: LucideIcon;
  let badgeLabel: string;
  let title: string;
  let body: string;

  if (isCancelled) {
    badgeTone = "error";
    badgeIcon = XCircle;
    badgeLabel = "Booking cancelled";
    title = "This trip is off the calendar.";
    body =
      "This reference is tied to a cancelled booking. If you think that is a mistake, email us with your reference and we will help.";
  } else if (isConfirmed && isPaid) {
    badgeTone = "success";
    badgeIcon = CheckCircle2;
    badgeLabel = "Confirmed and paid";
    title = "You are all set.";
    body = `We have recorded payment for ${booking.activity_name ?? "your activity"} on ${formatDate(booking.preferred_date)}. See you in the water — we will send any last-minute details to ${booking.customer_email}.`;
  } else if (isConfirmed) {
    badgeTone = "success";
    badgeIcon = Check;
    badgeLabel = "Booking confirmed";
    title = "You are on the roster.";
    body = `Your booking for ${booking.activity_name ?? "this activity"} on ${formatDate(booking.preferred_date)} is confirmed. Payment status: ${paymentStatus}. If anything still needs to be settled, we will reach out at ${booking.customer_email}.`;
  } else {
    badgeTone = "warning";
    badgeIcon = Hourglass;
    badgeLabel = "Request received";
    title = "See you in the water.";
    body =
      "Thanks — your booking request is in. Our team will be in touch within a few hours during business hours (Mactan, Cebu time) to confirm availability and arrange details.";
  }

  const BadgeIcon = badgeIcon;
  const paymentTone: BadgeTone =
    paymentStatus === "paid"
      ? "success"
      : paymentStatus === "partial"
        ? "warning"
        : paymentStatus === "refunded"
          ? "error"
          : "info";

  const statusTone: BadgeTone =
    status === "confirmed" || status === "completed"
      ? "success"
      : status === "pending"
        ? "warning"
        : status === "cancelled"
          ? "error"
          : "info";

  return (
    <section className="relative flex min-h-svh items-center bg-base-100 pt-24">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span
            className={`inline-flex items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.32em] ${BADGE_STYLES[badgeTone]}`}
          >
            <BadgeIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {badgeLabel}
          </span>

          <h1 className="h-display mt-8 text-[clamp(3rem,9vw,8rem)]">
            {title}
          </h1>

          <p className="mt-6 max-w-xl text-base text-base-content/75 md:text-lg">
            {body}
          </p>

          {!isCancelled && (isPending || (isConfirmed && !isPaid)) && (
            <p className="mt-4 max-w-xl text-sm text-base-content/60">
              Keep this page bookmarked — it updates when we confirm your
              booking and when payment is recorded.
            </p>
          )}

          {!isCancelled ? (
            <div className="mt-10 border border-base-content/10 bg-base-200/30 p-6 md:p-8">
              <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/55">
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                What happens next
              </p>
              <ol className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <NextStep
                  index={1}
                  icon={Mail}
                  title="Confirmation email"
                  description={
                    isConfirmed
                      ? "Already sent. Check your inbox (and spam) for details."
                      : "We send a confirmation email once a team member reviews your request."
                  }
                />
                <NextStep
                  index={2}
                  icon={CreditCard}
                  title="Quote and payment"
                  description={
                    isPaid
                      ? "Payment recorded. Your booking PDF is ready below."
                      : "We'll share the final quote and a secure way to settle the balance."
                  }
                />
                <NextStep
                  index={3}
                  icon={MapPin}
                  title="Trip day"
                  description="Arrive 15 minutes before your start time. Bring this reference for fast check-in."
                />
              </ol>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3 border border-base-content/40 px-6 py-4 text-xs uppercase tracking-[0.32em] hover:bg-base-content hover:text-base-100"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" strokeWidth={1.75} aria-hidden />
              Back to home
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="border border-base-content/15 bg-base-200/40 p-6 md:p-8">
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              Your reference
            </p>
            <p className="mt-3 break-all font-display text-3xl uppercase tracking-wider text-primary">
              {normalizedRef}
            </p>
            <p className="mt-3 text-sm text-base-content/60">
              Quote this code in any follow-up message — it lets us pull up
              your request immediately.
            </p>

            <dl className="mt-7 grid grid-cols-1 divide-y divide-base-content/10 border-y border-base-content/10">
              <DetailRow
                icon={CalendarDays}
                label="Activity"
                value={booking.activity_name ?? "—"}
              />
              <DetailRow
                icon={Clock}
                label="Date"
                value={formatDate(booking.preferred_date)}
              />
              <DetailRow
                icon={Users}
                label="Party"
                value={`${booking.party_size} pax`}
              />
              <DetailRowBadge
                icon={CheckCircle2}
                label="Status"
                value={status}
                tone={statusTone}
              />
              <DetailRowBadge
                icon={CreditCard}
                label="Payment"
                value={paymentStatus}
                tone={paymentTone}
              />
            </dl>

            <div className="mt-7 flex flex-col gap-3">
              {canDownloadQuotation && (
                <a
                  href={`/booking/confirmation/${encodedReference}/quote`}
                  className="inline-flex items-center justify-center gap-3 border border-base-content/40 px-6 py-3.5 text-xs uppercase tracking-[0.32em] transition hover:bg-base-content hover:text-base-100"
                >
                  <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Download quotation
                </a>
              )}
              {canDownloadPdf ? (
                <a
                  href={`/booking/confirmation/${encodedReference}/pdf`}
                  className="inline-flex items-center justify-center gap-3 border border-base-content/40 px-6 py-3.5 text-xs uppercase tracking-[0.32em] transition hover:bg-base-content hover:text-base-100"
                >
                  <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Download booking PDF
                </a>
              ) : (
                !isCancelled && (
                  <div className="inline-flex items-start gap-2 border border-base-content/15 bg-base-100 px-4 py-3 text-[11px] leading-relaxed text-base-content/65">
                    <HelpCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-base-content/45"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>
                      {isConfirmed
                        ? "Confirmation PDF is available once payment is marked paid."
                        : "Booking confirmation PDF is issued after we confirm your booking and record payment."}
                    </span>
                  </div>
                )
              )}
              <a
                href={`mailto:bookings@divescotty.com?subject=Booking%20${encodeURIComponent(normalizedRef)}`}
                className="inline-flex items-center justify-center gap-3 bg-primary px-6 py-3.5 text-xs uppercase tracking-[0.32em] text-primary-content shadow-sm transition hover:bg-primary/90"
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Email us about this booking
              </a>
              <a
                href={`https://wa.me/639176312960?text=Hi%20Scotty's,%20booking%20${encodeURIComponent(normalizedRef)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-3 border border-base-content/40 px-6 py-3.5 text-xs uppercase tracking-[0.32em] transition hover:bg-base-content hover:text-base-100"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Message on WhatsApp
              </a>
            </div>

            <div className="mt-6 border-t border-base-content/10 pt-5">
              <TrustList />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-base-content/55">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-base-content">
        {value}
      </dd>
    </div>
  );
}

function DetailRowBadge({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: BadgeTone;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-base-content/55">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </dt>
      <dd>
        <span
          className={`inline-flex items-center border px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] ${BADGE_STYLES[tone]}`}
        >
          {value}
        </span>
      </dd>
    </div>
  );
}

function NextStep({
  index,
  icon: Icon,
  title,
  description,
}: {
  index: number;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <li className="flex flex-col gap-3 border border-base-content/10 bg-base-100 p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {index}
        </span>
        <Icon className="h-4 w-4 text-base-content/50" strokeWidth={1.75} aria-hidden />
      </div>
      <div>
        <p className="font-display text-sm uppercase tracking-[0.18em]">
          {title}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-base-content/65">
          {description}
        </p>
      </div>
    </li>
  );
}

function TrustList() {
  const items: Array<{ icon: LucideIcon; label: string }> = [
    { icon: ShieldCheck, label: "Secure reference link" },
    { icon: Mail, label: "Email confirmation in hours" },
    { icon: MessageCircle, label: "Live support on WhatsApp" },
  ];
  return (
    <ul className="grid grid-cols-1 gap-2 text-[11px] text-base-content/60 sm:grid-cols-3">
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-start gap-1.5">
          <Icon
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-base-content/45"
            strokeWidth={1.75}
            aria-hidden
          />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
