import Image from "next/image";
import {
  AlignLeft,
  Compass,
  Hash,
  ImageIcon,
  MapPin,
  Plus,
  Save,
  Tag,
  Type as TypeIcon,
  type LucideIcon,
} from "lucide-react";
import { upsertLocation } from "@/app/actions/activities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LocationRow = {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  description: string | null;
  hero_image: string | null;
  sort_order: number;
};

export default async function AdminLocationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order");
  const rows = (data ?? []) as LocationRow[];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Catalog
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Locations</h1>
          <p className="mt-3 max-w-xl text-sm text-base-content/70">
            Dive sites and departure points. Locations appear on activity pages
            and on the public locations grid. Hero images are shown on the
            public landing.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/55">
          {rows.length} {rows.length === 1 ? "location" : "locations"}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="border border-dashed border-base-content/20 bg-base-200/30 p-10 text-center text-sm text-base-content/65">
          No locations yet. Create the first one below.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {rows.map((row) => (
            <LocationCard key={row.id} location={row} />
          ))}
        </div>
      )}

      <NewLocationForm />
    </div>
  );
}

function LocationCard({ location }: { location: LocationRow }) {
  return (
    <div className="border border-base-content/10 bg-base-100 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-base-content/10 bg-base-200/40 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg uppercase tracking-[0.18em]">
              {location.name}
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-base-content/60">
              /{location.slug}
              {location.region ? (
                <>
                  <span className="mx-1.5 text-base-content/30">·</span>
                  {location.region}
                </>
              ) : null}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 self-start border border-base-content/15 bg-base-100 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-base-content/65">
          <Hash className="h-3 w-3" strokeWidth={1.75} aria-hidden />
          Sort {location.sort_order}
        </span>
      </div>

      <form
        action={upsertLocation}
        encType="multipart/form-data"
        data-loading-message="Saving location…"
        className="grid grid-cols-1 gap-5 p-6 md:grid-cols-12"
      >
        <input type="hidden" name="id" value={location.id} />

        <Field
          icon={TypeIcon}
          label="Name"
          name="name"
          defaultValue={location.name}
          required
          className="md:col-span-5"
        />
        <Field
          icon={Tag}
          label="Slug"
          name="slug"
          defaultValue={location.slug}
          required
          helper="/locations/{slug}. Avoid changing after launch."
          className="md:col-span-3"
        />
        <Field
          icon={Compass}
          label="Region"
          name="region"
          defaultValue={location.region ?? ""}
          placeholder="Cebu, Bohol, Boracay…"
          className="md:col-span-3"
        />
        <Field
          icon={Hash}
          label="Order"
          name="sort_order"
          type="number"
          defaultValue={location.sort_order}
          className="md:col-span-1"
        />

        <HeroImageField
          currentValue={location.hero_image}
          className="md:col-span-5"
        />

        <TextareaField
          icon={AlignLeft}
          label="Description"
          name="description"
          defaultValue={location.description ?? ""}
          rows={6}
          placeholder="Shown on the public landing for this location."
          className="md:col-span-7"
        />

        <div className="md:col-span-12 flex flex-col gap-3 border-t border-base-content/10 pt-5 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-base-content/55">
            Changes apply immediately to the public site.
          </p>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-primary-content shadow-sm transition hover:bg-primary/90"
          >
            <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
            Save location
          </button>
        </div>
      </form>
    </div>
  );
}

function NewLocationForm() {
  return (
    <form
      action={upsertLocation}
      encType="multipart/form-data"
      data-loading-message="Creating location…"
      className="grid grid-cols-1 gap-5 border border-dashed border-base-content/25 bg-base-100/60 p-6 md:grid-cols-12"
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/55 md:col-span-12">
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        New location
      </div>
      <Field
        icon={TypeIcon}
        label="Name"
        name="name"
        required
        className="md:col-span-5"
      />
      <Field
        icon={Tag}
        label="Slug"
        name="slug"
        required
        helper="/locations/mactan, /locations/bohol, etc."
        className="md:col-span-3"
      />
      <Field
        icon={Compass}
        label="Region"
        name="region"
        placeholder="Cebu, Bohol, Boracay…"
        className="md:col-span-3"
      />
      <Field
        icon={Hash}
        label="Order"
        name="sort_order"
        type="number"
        defaultValue={0}
        className="md:col-span-1"
      />
      <HeroImageField currentValue={null} className="md:col-span-5" />
      <TextareaField
        icon={AlignLeft}
        label="Description"
        name="description"
        rows={6}
        placeholder="Shown on the public landing for this location."
        className="md:col-span-7"
      />
      <div className="md:col-span-12 flex justify-end border-t border-base-content/10 pt-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-xs uppercase tracking-[0.28em] text-primary-content shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Create location
        </button>
      </div>
    </form>
  );
}

function HeroImageField({
  className,
  currentValue,
}: {
  className?: string;
  currentValue: string | null;
}) {
  const isExternal = currentValue?.startsWith("http") ?? false;
  const isDataUrl = currentValue?.startsWith("data:") ?? false;
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        Hero image (PNG/JPEG)
      </span>
      <input type="hidden" name="hero_image_current" value={currentValue ?? ""} />
      <input
        type="file"
        name="hero_image_file"
        accept="image/png,image/jpeg"
        className="file-input file-input-bordered w-full bg-base-100"
      />
      {currentValue ? (
        <div className="mt-1 flex items-start gap-3 border border-base-content/10 bg-base-200/40 p-2">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-base-300">
            {isExternal || isDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentValue}
                alt="Current hero"
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={currentValue}
                alt="Current hero"
                fill
                sizes="96px"
                className="object-cover"
              />
            )}
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-base-content/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              Current image saved
            </span>
            <span className="text-[10px] text-base-content/45">
              Upload a new file above to replace it.
            </span>
          </div>
        </div>
      ) : (
        <span className="mt-1 text-[11px] text-base-content/45">
          No image uploaded yet.
        </span>
      )}
    </label>
  );
}

function FieldShell({
  icon: Icon,
  label,
  helper,
  className,
  children,
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </span>
      {children}
      {helper ? (
        <span className="text-[11px] leading-relaxed text-base-content/50">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function Field({
  icon,
  label,
  helper,
  className,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell icon={icon} label={label} helper={helper} className={className}>
      <input className="input input-bordered w-full bg-base-100" {...rest} />
    </FieldShell>
  );
}

function TextareaField({
  icon,
  label,
  helper,
  className,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell icon={icon} label={label} helper={helper} className={className}>
      <textarea
        className="textarea textarea-bordered w-full bg-base-100 leading-relaxed"
        {...rest}
      />
    </FieldShell>
  );
}
