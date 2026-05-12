"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createBooking, type CreateBookingState } from "@/app/actions/bookings";
import {
  defaultPartySizeForBooking,
  PARTY_SIZE_MAX,
  PARTY_SIZE_MIN,
} from "@/lib/booking-party-limits";
import { formatPricePHP } from "@/lib/utils";

type ActivityOption = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  image_url: string | null;
  price_cents: number | null;
  availability_label: string | null;
  min_party: number;
  max_party: number;
};

type LocationOption = {
  id: string;
  name: string;
};

type EmployeeOption = {
  id: string;
  name: string;
  role: string;
  employee_code: string;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
};

const initialState: CreateBookingState = {};
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

export function ScubaBookingExperience({
  activities,
  locations,
  employees,
  initialActivitySlug,
  autoOpen,
}: {
  activities: ActivityOption[];
  locations: LocationOption[];
  employees: EmployeeOption[];
  initialActivitySlug?: string;
  autoOpen?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createBooking, initialState);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    activities[0]?.id ?? "",
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === selectedActivityId) ?? activities[0],
    [activities, selectedActivityId],
  );
  useEffect(() => {
    if (!initialActivitySlug) return;
    const bySlug = activities.find((a) => a.slug === initialActivitySlug);
    if (!bySlug) return;
    setSelectedActivityId(bySlug.id);
    if (autoOpen) {
      modalRef.current?.showModal();
    }
  }, [activities, autoOpen, initialActivitySlug]);

  function openForActivity(activityId: string) {
    setSelectedActivityId(activityId);
    modalRef.current?.showModal();
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <article
            key={activity.id}
            className="card border border-base-content/15 bg-base-200/40 shadow-sm"
          >
            <div className="card-body">
              <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                {activity.availability_label ?? "Available"}
              </p>
              <h3 className="card-title font-display text-3xl uppercase">
                {activity.name}
              </h3>
              <p className="text-sm text-base-content/70">
                {activity.short_description ?? "Scuba booking option"}
              </p>
              <p className="mt-2 text-sm">
                From{" "}
                <span className="font-semibold">
                  {formatPricePHP(activity.price_cents)}
                </span>
              </p>
              <div className="card-actions mt-3 justify-end">
                <button
                  type="button"
                  className="btn btn-primary uppercase tracking-[0.2em]"
                  onClick={() => openForActivity(activity.id)}
                >
                  Book now
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-4xl bg-base-100">
          <h3 className="font-display text-3xl uppercase">Book scuba trip</h3>
          <p className="mt-2 text-sm text-base-content/70">
            Type is preselected based on the card you clicked.
          </p>

          <form action={formAction} className="mt-6 grid grid-cols-1 gap-4">
            <input type="hidden" name="activityId" value={selectedActivity?.id ?? ""} />
            <input type="hidden" name="employeeId" value={selectedEmployeeId} />

            <label className="form-control">
              <span className="label-text text-xs uppercase tracking-[0.2em]">Type</span>
              <input
                type="text"
                readOnly
                value={selectedActivity?.name ?? ""}
                className="input input-bordered bg-base-200/60"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input label="Name" name="customerName" required />
              <Input label="Phone" name="customerPhone" type="tel" required />
              <Input label="Email" name="customerEmail" type="email" required />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label-text text-xs uppercase tracking-[0.2em]">
                  Location
                </span>
                <select
                  name="locationId"
                  defaultValue=""
                  className="select select-bordered bg-base-200/60"
                >
                  <option value="">No preference</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text text-xs uppercase tracking-[0.2em]">
                  Start time
                </span>
                <select
                  name="preferredTime"
                  defaultValue=""
                  className="select select-bordered bg-base-200/60"
                >
                  <option value="">No preference</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text text-xs uppercase tracking-[0.2em]">
                  End time
                </span>
                <select
                  name="preferredTimeEnd"
                  defaultValue=""
                  className="select select-bordered bg-base-200/60"
                >
                  <option value="">No preference</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Preferred date" name="preferredDate" type="date" required />
              <Input
                key={`party-${selectedActivity?.id ?? "x"}`}
                label="Party size"
                name="partySize"
                type="number"
                min={PARTY_SIZE_MIN}
                max={PARTY_SIZE_MAX}
                defaultValue={defaultPartySizeForBooking(
                  selectedActivity?.min_party ?? PARTY_SIZE_MIN,
                  selectedActivity?.max_party ?? PARTY_SIZE_MAX,
                )}
                required
              />
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-base-content/70">
                Pick employee (optional)
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    className={`card border text-left transition ${
                      selectedEmployeeId === employee.id
                        ? "border-primary bg-primary/10"
                        : "border-base-content/15 bg-base-200/30"
                    }`}
                  >
                    <div className="card-body p-4">
                      <p className="font-semibold">{employee.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                        {employee.role} · {employee.employee_code}
                      </p>
                      <p className="text-xs text-base-content/70">
                        {employee.phone ?? "No phone"} · {employee.email ?? "No email"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <label className="form-control">
              <span className="label-text text-xs uppercase tracking-[0.2em]">
                Notes
              </span>
              <textarea
                name="specialRequests"
                rows={3}
                className="textarea textarea-bordered bg-base-200/60"
              />
            </label>

            {state?.formError && (
              <p className="text-sm text-error">{state.formError}</p>
            )}

            <div className="modal-action mt-2">
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit booking"
                )}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => modalRef.current?.close()}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

function Input({
  label,
  ...rest
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="form-control">
      <span className="label-text text-xs uppercase tracking-[0.2em]">{label}</span>
      <input {...rest} className="input input-bordered bg-base-200/60" />
    </label>
  );
}
