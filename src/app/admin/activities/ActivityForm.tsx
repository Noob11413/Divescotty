"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  upsertActivity,
  type ActivityActionState,
} from "@/app/actions/activities";

interface ActivityFormProps {
  activity?: {
    id?: string;
    slug?: string;
    name?: string;
    category_id?: string;
    subcategory_id?: string | null;
    short_description?: string | null;
    description?: string | null;
    duration_minutes?: number | null;
    price_cents?: number | null;
    min_party?: number;
    max_party?: number;
    image_url?: string | null;
    availability_label?: string | null;
    is_published?: boolean;
    is_featured?: boolean;
    sort_order?: number;
    location_ids?: string[];
  };
  categories: { id: string; name: string }[];
  subcategories: { id: string; name: string; category_id: string }[];
  locations: { id: string; name: string }[];
}

const initialState: ActivityActionState = {};

export function ActivityForm({
  activity,
  categories,
  subcategories,
  locations,
}: ActivityFormProps) {
  const [state, formAction, pending] = useActionState(
    upsertActivity,
    initialState,
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    activity?.location_ids ?? [],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    activity?.category_id ?? "",
  );
  const [availabilityStartRaw = "", availabilityEndRaw = ""] =
    (activity?.availability_label ?? "").split(" to ").map((v) => v.trim());
  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  const availabilityStart = validDate.test(availabilityStartRaw)
    ? availabilityStartRaw
    : "";
  const availabilityEnd = validDate.test(availabilityEndRaw)
    ? availabilityEndRaw
    : "";
  const filteredSubcategories = subcategories.filter(
    (subcategory) => subcategory.category_id === selectedCategoryId,
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {activity?.id && <input type="hidden" name="id" value={activity.id} />}
      <input
        type="hidden"
        name="locationIds"
        value={selectedLocations.join(",")}
      />

      <Field
        label="Name"
        name="name"
        defaultValue={activity?.name ?? ""}
        required
        error={state?.fieldErrors?.name}
      />
      <Field
        label="Slug"
        name="slug"
        defaultValue={activity?.slug ?? ""}
        required
        placeholder="discover-scuba"
        error={state?.fieldErrors?.slug}
      />

      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Category
        </span>
        <select
          name="categoryId"
          defaultValue={activity?.category_id ?? ""}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          required
          className="select select-bordered bg-base-100"
        >
          <option value="" disabled>
            Choose…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.categoryId && (
          <span className="text-xs text-error">
            {state.fieldErrors.categoryId}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Subcategory
        </span>
        <select
          name="subcategoryId"
          defaultValue={activity?.subcategory_id ?? ""}
          className="select select-bordered bg-base-100"
        >
          <option value="">None</option>
          {filteredSubcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Image URL"
        name="imageUrl"
        defaultValue={activity?.image_url ?? ""}
        placeholder="/media/scuba.jpg or https://…"
      />

      <Field
        label="Short description"
        name="shortDescription"
        defaultValue={activity?.short_description ?? ""}
        full
      />

      <label className="flex flex-col gap-2 lg:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Long description
        </span>
        <textarea
          name="description"
          rows={6}
          defaultValue={activity?.description ?? ""}
          className="textarea textarea-bordered bg-base-100"
        />
      </label>

      <Field
        label="Duration (minutes)"
        name="durationMinutes"
        type="number"
        defaultValue={activity?.duration_minutes ?? ""}
      />
      <Field
        label="Price (PHP)"
        name="pricePhp"
        type="number"
        step="0.01"
        defaultValue={
          activity?.price_cents != null ? activity.price_cents / 100 : ""
        }
      />
      <Field
        label="Min party"
        name="minParty"
        type="number"
        min={2}
        max={20}
        defaultValue={activity?.min_party ?? 2}
      />
      <Field
        label="Max party"
        name="maxParty"
        type="number"
        min={2}
        max={20}
        defaultValue={activity?.max_party ?? 20}
      />
      <Field
        label="Availability start"
        name="availabilityStart"
        type="date"
        defaultValue={availabilityStart}
        error={state?.fieldErrors?.availabilityStart}
      />
      <Field
        label="Availability end"
        name="availabilityEnd"
        type="date"
        defaultValue={availabilityEnd}
        error={state?.fieldErrors?.availabilityEnd}
      />
      <Field
        label="Sort order"
        name="sortOrder"
        type="number"
        defaultValue={activity?.sort_order ?? 0}
      />

      <fieldset className="flex flex-col gap-2 lg:col-span-2">
        <legend className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Locations
        </legend>
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => {
            const active = selectedLocations.includes(loc.id);
            return (
              <button
                type="button"
                key={loc.id}
                onClick={() =>
                  setSelectedLocations((s) =>
                    active
                      ? s.filter((id) => id !== loc.id)
                      : [...s, loc.id],
                  )
                }
                className={`border px-3 py-1.5 text-xs uppercase tracking-[0.28em] ${
                  active
                    ? "border-primary bg-primary text-primary-content"
                    : "border-base-content/30 hover:border-base-content"
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-6 lg:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={activity?.is_published ?? false}
            className="checkbox"
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={activity?.is_featured ?? false}
            className="checkbox"
          />
          Featured on home
        </label>
      </div>

      {state?.formError && (
        <div className="lg:col-span-2 border border-error/40 bg-error/10 p-3 text-sm text-error">
          {state.formError}
        </div>
      )}

      <div className="lg:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-3 bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save activity"
          )}
        </button>
        {state?.ok && (
          <span className="text-xs uppercase tracking-[0.32em] text-success">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  full,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  full?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={`flex flex-col gap-2 ${full ? "lg:col-span-2" : ""}`}
    >
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input
        name={name}
        className="input input-bordered bg-base-100"
        {...rest}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}
