"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import {
  createCustomBookingRequest,
  type CreateCustomBookingRequestState,
} from "@/app/actions/custom-bookings";
import { PARTY_SIZE_MAX, PARTY_SIZE_MIN } from "@/lib/booking-party-limits";

const initialState: CreateCustomBookingRequestState = {};
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

export function CustomBookingRequestForm({
  locations,
}: {
  locations: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    createCustomBookingRequest,
    initialState,
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4">
      {state?.ok && (
        <div className="border border-success/40 bg-success/10 p-3 text-sm text-success">
          Custom request sent. Reference:{" "}
          <span className="font-mono">{state.reference}</span>
        </div>
      )}
      {state?.formError && (
        <div className="border border-error/40 bg-error/10 p-3 text-sm text-error">
          {state.formError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field
          label="Full name"
          name="customerName"
          required
          error={state?.fieldErrors?.customerName}
        />
        <Field
          label="Email"
          name="customerEmail"
          type="email"
          required
          error={state?.fieldErrors?.customerEmail}
        />
        <Field
          label="Phone / WhatsApp"
          name="customerPhone"
          required
          error={state?.fieldErrors?.customerPhone}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Field
          label="Preferred date"
          name="preferredDate"
          type="date"
          error={state?.fieldErrors?.preferredDate}
        />
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Preferred time
          </span>
          <select
            name="preferredTime"
            defaultValue=""
            className="select select-bordered bg-base-100"
          >
            <option value="">No preference</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Party size"
          name="partySize"
          type="number"
          min={PARTY_SIZE_MIN}
          max={PARTY_SIZE_MAX}
          defaultValue={PARTY_SIZE_MIN}
          required
          error={state?.fieldErrors?.partySize}
        />
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Location (optional)
          </span>
          <select name="locationId" defaultValue="" className="select select-bordered bg-base-100">
            <option value="">No preference</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Budget notes (optional)"
          name="budgetNotes"
          placeholder="Example: around PHP 5,000 per person"
          error={state?.fieldErrors?.budgetNotes}
        />
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Schedule flexibility
          </span>
          <select name="flexibility" defaultValue="flexible" className="select select-bordered bg-base-100">
            <option value="flexible">Flexible</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Tell us your custom plan
        </span>
        <textarea
          name="requestDetails"
          rows={5}
          required
          maxLength={4000}
          className="textarea textarea-bordered bg-base-100"
          placeholder="Trip idea, certification level, number of days, target dive sites, special needs..."
        />
        {state?.fieldErrors?.requestDetails && (
          <span className="text-xs text-error">{state.fieldErrors.requestDetails}</span>
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
            Sending...
          </>
        ) : (
          <>
            Send custom request
            <Send className="h-4 w-4" strokeWidth={1.5} />
          </>
        )}
      </button>
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
      <input name={name} className="input input-bordered bg-base-100" {...rest} />
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}
