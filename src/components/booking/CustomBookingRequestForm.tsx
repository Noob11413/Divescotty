"use client";

import { useActionState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Compass,
  GitFork,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  createCustomBookingRequest,
  type CreateCustomBookingRequestState,
} from "@/app/actions/custom-bookings";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  CUSTOM_PARTY_SIZE_MAX,
  CUSTOM_PARTY_SIZE_MIN,
} from "@/lib/booking-party-limits";

const initialState: CreateCustomBookingRequestState = {};
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CustomBookingRequestForm({
  locations,
}: {
  locations: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    createCustomBookingRequest,
    initialState,
  );
  const { showToast } = useAdminToast();
  const minDate = todayIsoDate();

  useEffect(() => {
    if (state?.formError) {
      showToast({ variant: "error", message: state.formError });
    }
  }, [state, showToast]);

  return (
    <form
      action={formAction}
      data-loading-message="Sending custom request…"
      className="flex flex-col gap-7"
    >
      <input type="hidden" name="return_to" value="/contact" />

      <header className="flex flex-col gap-3 border-b border-base-content/10 pb-5">
        <p className="eyebrow">Custom request</p>
        <h2 className="font-display text-3xl uppercase leading-tight">
          Tell us about your trip
        </h2>
        <p className="text-sm text-base-content/65">
          A real human reviews every request. We&apos;ll send a tailored quote
          and itinerary, usually within a few hours.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <InlineBadge icon={Clock}>Reply in hours</InlineBadge>
          <InlineBadge icon={Wallet}>Free quote</InlineBadge>
          <InlineBadge icon={Sparkles}>Fully customizable</InlineBadge>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <SectionLabel icon={User}>Your details</SectionLabel>
        <Field
          icon={User}
          label="Full name"
          name="customerName"
          type="text"
          autoComplete="name"
          placeholder="Juan dela Cruz"
          required
          error={state?.fieldErrors?.customerName}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            icon={Mail}
            label="Email"
            name="customerEmail"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            error={state?.fieldErrors?.customerEmail}
          />
          <Field
            icon={Phone}
            label="Phone / WhatsApp"
            name="customerPhone"
            type="tel"
            autoComplete="tel"
            placeholder="+63 917 000 0000"
            required
            error={state?.fieldErrors?.customerPhone}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel icon={CalendarDays}>Trip details</SectionLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            icon={CalendarDays}
            label="Preferred date"
            name="preferredDate"
            type="date"
            min={minDate}
            helper="Leave blank if open."
            error={state?.fieldErrors?.preferredDate}
          />
          <SelectField
            icon={Clock}
            label="Preferred time"
            name="preferredTime"
            defaultValue=""
          >
            <option value="">No preference</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </SelectField>
          <Field
            icon={Users}
            label="Party size"
            name="partySize"
            type="number"
            min={CUSTOM_PARTY_SIZE_MIN}
            max={CUSTOM_PARTY_SIZE_MAX}
            defaultValue={2}
            required
            helper={`Up to ${CUSTOM_PARTY_SIZE_MAX}. Larger? Mention it in your plan.`}
            error={state?.fieldErrors?.partySize}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            icon={MapPin}
            label="Location (optional)"
            name="locationId"
            defaultValue=""
            helper="Pick a base, or let us suggest one."
          >
            <option value="">No preference</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            icon={GitFork}
            label="Schedule flexibility"
            name="flexibility"
            defaultValue="flexible"
            helper="Flexible dates often unlock better pricing."
          >
            <option value="flexible">Flexible</option>
            <option value="fixed">Fixed</option>
          </SelectField>
        </div>

        <Field
          icon={Wallet}
          label="Budget notes (optional)"
          name="budgetNotes"
          placeholder="Example: around PHP 5,000 per person"
          helper="Helps us match the right experience to your budget."
          error={state?.fieldErrors?.budgetNotes}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel icon={MessageSquare}>Your plan</SectionLabel>
        <TextareaField
          icon={Compass}
          label="Tell us your custom plan"
          name="requestDetails"
          rows={5}
          required
          maxLength={4000}
          placeholder="Trip idea, certification level, number of days, target dive sites, special needs…"
          helper="The more detail you share, the more accurate our quote."
          error={state?.fieldErrors?.requestDetails}
        />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-3 bg-primary px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary-content shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send custom request
            <Send className="h-4 w-4" strokeWidth={1.75} />
          </>
        )}
      </button>

      <div className="grid grid-cols-1 gap-2 border-t border-base-content/10 pt-4 text-[11px] leading-relaxed text-base-content/60 sm:grid-cols-3">
        <TrustItem icon={ShieldCheck}>No charge until you approve</TrustItem>
        <TrustItem icon={Mail}>Tailored quote in hours</TrustItem>
        <TrustItem icon={Lock}>Your info stays private</TrustItem>
      </div>
    </form>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/55">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {children}
    </div>
  );
}

function InlineBadge({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-base-content/15 bg-base-100/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-base-content/70">
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      {children}
    </span>
  );
}

function TrustItem({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-start gap-1.5">
      <Icon
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-base-content/45"
        strokeWidth={1.75}
        aria-hidden
      />
      <span>{children}</span>
    </span>
  );
}

function FieldShell({
  icon: Icon,
  label,
  helper,
  error,
  children,
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-error">{error}</span>
      ) : helper ? (
        <span className="text-[11px] text-base-content/50">{helper}</span>
      ) : null}
    </label>
  );
}

function Field({
  icon,
  label,
  helper,
  error,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell icon={icon} label={label} helper={helper} error={error}>
      <input className="input input-bordered w-full bg-base-200/60" {...rest} />
    </FieldShell>
  );
}

function SelectField({
  icon,
  label,
  helper,
  error,
  children,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">) {
  return (
    <FieldShell icon={icon} label={label} helper={helper} error={error}>
      <select className="select select-bordered w-full bg-base-200/60" {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

function TextareaField({
  icon,
  label,
  helper,
  error,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell icon={icon} label={label} helper={helper} error={error}>
      <textarea
        className="textarea textarea-bordered w-full bg-base-200/60 leading-relaxed"
        {...rest}
      />
    </FieldShell>
  );
}
