import {
  deleteCategory,
  deleteSubcategory,
  upsertCategory,
  upsertSubcategory,
} from "@/app/actions/activities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [rowsRes, subResScoped] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("subcategories")
      .select("*")
      .order("sort_order"),
  ]);
  const subRes = subResScoped;
  const rows = (rowsRes.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    hero_image: string | null;
    sort_order: number;
    deleted_at: string | null;
  }>;
  const subcategories = (subRes.data ?? []) as Array<{
    id: string;
    category_id: string;
    slug: string;
    name: string;
    description: string | null;
    sort_order: number;
    deleted_at: string | null;
  }>;
  const byCategory = new Map<string, typeof subcategories>();
  for (const subcategory of subcategories) {
    const arr = byCategory.get(subcategory.category_id) ?? [];
    arr.push(subcategory);
    byCategory.set(subcategory.category_id, arr);
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Catalog
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase">Categories</h1>
        <p className="mt-2 max-w-xl text-sm text-base-content/65">
          The four pillars of the site. Editing the slug after launch is
          discouraged — the rest is fully editable.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {rows.map((row) => (
          <div
            key={row.id}
            className="border border-base-content/10 bg-base-200/40 p-6"
          >
            <form
              action={upsertCategory}
              encType="multipart/form-data"
              className="grid grid-cols-1 gap-3 lg:grid-cols-12"
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
                label="Tagline"
                name="tagline"
                defaultValue={row.tagline ?? ""}
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

              <div className="lg:col-span-12 flex justify-end">
                <button
                  type="submit"
                  className="bg-primary px-6 py-2 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </form>

            <div className="mt-4 flex items-center gap-2 border-t border-base-content/10 pt-4">
              <span
                className={`text-[10px] uppercase tracking-[0.28em] ${
                  row.deleted_at ? "text-warning" : "text-success"
                }`}
              >
                {row.deleted_at ? "Soft deleted" : "Active"}
              </span>
              <div className="ml-auto flex gap-2">
                {row.deleted_at ? (
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="mode" value="restore" />
                    <button
                      type="submit"
                      className="border border-success/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-success hover:bg-success hover:text-success-content"
                    >
                      Restore
                    </button>
                  </form>
                ) : (
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="mode" value="soft" />
                    <button
                      type="submit"
                      className="border border-warning/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-warning hover:bg-warning hover:text-warning-content"
                    >
                      Soft delete
                    </button>
                  </form>
                )}
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="mode" value="hard" />
                  <button
                    type="submit"
                    className="border border-error/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-error hover:bg-error hover:text-error-content"
                  >
                    Hard delete
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-6 border-t border-base-content/10 pt-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                Subcategories
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {(byCategory.get(row.id) ?? []).map((subcategory) => (
                  <SubcategoryRow
                    key={subcategory.id}
                    subcategory={subcategory}
                  />
                ))}
                <NewSubcategoryForm categoryId={row.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <NewCategoryForm />
    </div>
  );
}

function SubcategoryRow({
  subcategory,
}: {
  subcategory: {
    id: string;
    category_id: string;
    slug: string;
    name: string;
    description: string | null;
    sort_order: number;
    deleted_at: string | null;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border border-base-content/10 bg-base-100 p-3 lg:grid-cols-12">
      <form action={upsertSubcategory} className="grid grid-cols-1 gap-2 lg:col-span-10 lg:grid-cols-10">
        <input type="hidden" name="id" value={subcategory.id} />
        <input type="hidden" name="category_id" value={subcategory.category_id} />
        <Field
          label="Name"
          name="name"
          defaultValue={subcategory.name}
          className="lg:col-span-3"
          required
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={subcategory.slug}
          className="lg:col-span-3"
          required
        />
        <Field
          label="Order"
          name="sort_order"
          type="number"
          defaultValue={subcategory.sort_order}
          className="lg:col-span-2"
        />
        <Field
          label="Description"
          name="description"
          defaultValue={subcategory.description ?? ""}
          className="lg:col-span-2"
        />
        <div className="lg:col-span-10 flex justify-end">
          <button
            type="submit"
            className="bg-primary px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
          >
            Save subcategory
          </button>
        </div>
      </form>
      <div className="lg:col-span-2 flex items-end justify-end gap-2">
        {subcategory.deleted_at ? (
          <form action={deleteSubcategory}>
            <input type="hidden" name="id" value={subcategory.id} />
            <input type="hidden" name="mode" value="restore" />
            <button
              type="submit"
              className="border border-success/40 px-3 py-2 text-xs uppercase tracking-[0.28em] text-success hover:bg-success hover:text-success-content"
            >
              Restore
            </button>
          </form>
        ) : (
          <form action={deleteSubcategory}>
            <input type="hidden" name="id" value={subcategory.id} />
            <input type="hidden" name="mode" value="soft" />
            <button
              type="submit"
              className="border border-warning/40 px-3 py-2 text-xs uppercase tracking-[0.28em] text-warning hover:bg-warning hover:text-warning-content"
            >
              Soft
            </button>
          </form>
        )}
        <form action={deleteSubcategory}>
          <input type="hidden" name="id" value={subcategory.id} />
          <input type="hidden" name="mode" value="hard" />
          <button
            type="submit"
            className="border border-error/40 px-3 py-2 text-xs uppercase tracking-[0.28em] text-error hover:bg-error hover:text-error-content"
          >
            Hard
          </button>
        </form>
      </div>
    </div>
  );
}

function NewSubcategoryForm({ categoryId }: { categoryId: string }) {
  return (
    <form
      action={upsertSubcategory}
      className="grid grid-cols-1 gap-2 border border-dashed border-base-content/20 bg-base-100 p-3 lg:grid-cols-12"
    >
      <input type="hidden" name="category_id" value={categoryId} />
      <Field label="Name" name="name" className="lg:col-span-4" required />
      <Field label="Slug" name="slug" className="lg:col-span-4" required />
      <Field
        label="Order"
        name="sort_order"
        type="number"
        defaultValue={0}
        className="lg:col-span-2"
      />
      <div className="lg:col-span-2 flex items-end justify-end">
        <button
          type="submit"
          className="border border-base-content/30 px-3 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
        >
          Add subcategory
        </button>
      </div>
    </form>
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

function NewCategoryForm() {
  return (
    <form
      action={upsertCategory}
      encType="multipart/form-data"
      className="grid grid-cols-1 gap-3 border border-dashed border-base-content/20 bg-base-100 p-6 lg:grid-cols-12"
    >
      <p className="lg:col-span-12 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        New category
      </p>
      <Field label="Name" name="name" className="lg:col-span-3" required />
      <Field label="Slug" name="slug" className="lg:col-span-2" required />
      <Field label="Tagline" name="tagline" className="lg:col-span-3" />
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
