import { upsertLocation } from "@/app/actions/activities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order");

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Catalog
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase">Locations</h1>
      </header>

      <div className="flex flex-col gap-8">
        {(rows ?? []).map((row) => (
          <form
            key={row.id}
            action={upsertLocation}
            encType="multipart/form-data"
            className="grid grid-cols-1 gap-3 border border-base-content/10 bg-base-200/40 p-6 lg:grid-cols-12"
          >
            <input type="hidden" name="id" value={row.id} />
            <Field
              label="Name"
              name="name"
              defaultValue={row.name}
              className="lg:col-span-3"
            />
            <Field
              label="Slug"
              name="slug"
              defaultValue={row.slug}
              className="lg:col-span-2"
            />
            <Field
              label="Region"
              name="region"
              defaultValue={row.region ?? ""}
              className="lg:col-span-3"
            />
            <HeroImageField
              className="lg:col-span-3"
              currentValue={row.hero_image ?? null}
            />
            <Field
              label="Order"
              name="sort_order"
              type="number"
              defaultValue={row.sort_order}
              className="lg:col-span-1"
            />

            <label className="flex flex-col gap-2 lg:col-span-12">
              <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                Description
              </span>
              <textarea
                name="description"
                rows={3}
                defaultValue={row.description ?? ""}
                className="textarea textarea-bordered bg-base-100"
              />
            </label>

            <div className="lg:col-span-12 flex">
              <button
                type="submit"
                className="ml-auto bg-primary px-6 py-2 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </form>
        ))}
      </div>

      <form
        action={upsertLocation}
        encType="multipart/form-data"
        className="grid grid-cols-1 gap-3 border border-dashed border-base-content/20 bg-base-100 p-6 lg:grid-cols-12"
      >
        <p className="lg:col-span-12 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          New location
        </p>
        <Field label="Name" name="name" className="lg:col-span-3" required />
        <Field label="Slug" name="slug" className="lg:col-span-2" required />
        <Field label="Region" name="region" className="lg:col-span-3" />
        <HeroImageField className="lg:col-span-3" currentValue={null} />
        <Field
          label="Order"
          name="sort_order"
          type="number"
          defaultValue={0}
          className="lg:col-span-1"
        />
        <div className="lg:col-span-12 flex">
          <button
            type="submit"
            className="ml-auto bg-primary px-6 py-2 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  className = "",
  ...rest
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input className="input input-bordered bg-base-100" {...rest} />
    </label>
  );
}

function HeroImageField({
  className,
  currentValue,
}: {
  className?: string;
  currentValue: string | null;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        Hero image (PNG/JPEG)
      </span>
      <input type="hidden" name="hero_image_current" value={currentValue ?? ""} />
      <input
        type="file"
        name="hero_image_file"
        accept="image/png,image/jpeg"
        className="file-input file-input-bordered bg-base-100"
      />
      {currentValue && (
        <span className="truncate text-xs text-base-content/60">
          Current saved image available
        </span>
      )}
    </label>
  );
}
