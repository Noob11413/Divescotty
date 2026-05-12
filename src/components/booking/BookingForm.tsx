"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { createBooking, type CreateBookingState } from "@/app/actions/bookings";
import {
  defaultPartySizeForBooking,
  PARTY_SIZE_MAX,
  PARTY_SIZE_MIN,
} from "@/lib/booking-party-limits";

interface BookingFormProps {
  activityId: string;
  activityName: string;
  pricePhpCents: number | null;
  locations: { id: string; slug: string; name: string }[];
  minParty: number;
  maxParty: number;
}

const initialState: CreateBookingState = {};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

export function BookingForm({
  activityId,
  activityName,
  locations,
  minParty,
  maxParty,
}: BookingFormProps) {
  const [state, formAction, pending] = useActionState(
    createBooking,
    initialState,
  );
  const partyDefault = defaultPartySizeForBooking(minParty, maxParty);

  return (
    <form action={formAction} className="flex flex-col gap-5" id="book">
      <input type="hidden" name="activityId" value={activityId} />

      <div className="flex flex-col gap-1">
        <p className="eyebrow">Request booking</p>
        <p className="font-display text-3xl uppercase">{activityName}</p>
      </div>

      {state?.formError && (
        <div className="border border-error/40 bg-error/10 p-3 text-sm text-error">
          {state.formError}
        </div>
      )}

      <Field
        label="Full name"
        name="customerName"
        type="text"
        autoComplete="name"
        required
        error={state?.fieldErrors?.customerName}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Email"
          name="customerEmail"
          type="email"
          autoComplete="email"
          required
          error={state?.fieldErrors?.customerEmail}
        />
        <Field
          label="Phone / WhatsApp"
          name="customerPhone"
          type="tel"
          autoComplete="tel"
          required
          error={state?.fieldErrors?.customerPhone}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field
          label="Party size"
          name="partySize"
          type="number"
          min={PARTY_SIZE_MIN}
          max={PARTY_SIZE_MAX}
          defaultValue={partyDefault}
          required
          error={state?.fieldErrors?.partySize}
        />
        <Field
          label="Preferred date"
          name="preferredDate"
          type="date"
          required
          error={state?.fieldErrors?.preferredDate}
        />
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Preferred time
          </span>
          <select
            name="preferredTime"
            defaultValue=""
            className="select select-bordered bg-base-200/60"
          >
            <option value="">No preference</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.preferredTime && (
            <span className="text-xs text-error">{state.fieldErrors.preferredTime}</span>
          )}
        </label>
      </div>

      {locations.length > 0 && (
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Departure location
          </span>
          <select
            name="locationId"
            defaultValue=""
            className="select select-bordered bg-base-200/60"
          >
            <option value="">No preference</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Special requests (optional)
        </span>
        <textarea
          name="specialRequests"
          rows={3}
          maxLength={2000}
          placeholder="Allergies, dietary needs, certifications, group context…"
          className="textarea textarea-bordered bg-base-200/60"
        />
        {state?.fieldErrors?.specialRequests && (
          <span className="text-xs text-error">
            {state.fieldErrors.specialRequests}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-3 bg-primary px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary-content transition hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            Request booking
            <Send className="h-4 w-4" strokeWidth={1.5} />
          </>
        )}
      </button>

      <p className="text-xs text-base-content/50">
        We&apos;ll email and message you within a few hours to confirm
        availability and arrange payment. No charge taken at booking time.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input
        name={name}
        className="input input-bordered bg-base-200/60"
        {...rest}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}
