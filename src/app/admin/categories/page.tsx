import Image from "next/image";
import {
  AlignLeft,
  ArrowDown,
  FolderTree,
  Hash,
  ImageIcon,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Tag,
  Trash2,
  TriangleAlert,
  Type as TypeIcon,
  type LucideIcon,
} from "lucide-react";
import {
  deleteCategory,
  deleteSubcategory,
  upsertCategory,
  upsertSubcategory,
} from "@/app/actions/activities";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  hero_image: string | null;
  sort_order: number;
  deleted_at: string | null;
};

type SubcategoryRowType = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  deleted_at: string | null;
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [rowsRes, subResScoped] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("subcategories").select("*").order("sort_order"),
  ]);
  const rows = (rowsRes.data ?? []) as CategoryRow[];
  const subcategories = (subResScoped.data ?? []) as SubcategoryRowType[];

  const byCategory = new Map<string, SubcategoryRowType[]>();
  for (const subcategory of subcategories) {
    const arr = byCategory.get(subcategory.category_id) ?? [];
    arr.push(subcategory);
    byCategory.set(subcategory.category_id, arr);
  }

  const activeCount = rows.filter((r) => !r.deleted_at).length;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Catalog
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Categories</h1>
          <p className="mt-3 max-w-xl text-sm text-base-content/70">
            The pillars of the public site. Editing the slug after launch is
            discouraged (it changes URLs); the rest is fully editable. Each
            category can also have a list of subcategories.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/55">
          {activeCount}/{rows.length} active
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="border border-dashed border-base-content/20 bg-base-200/30 p-10 text-center text-sm text-base-content/65">
          No categories yet. Create the first one below.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {rows.map((row) => (
            <CategoryCard
              key={row.id}
              category={row}
              subcategories={byCategory.get(row.id) ?? []}
            />
          ))}
        </div>
      )}

      <NewCategoryForm />
    </div>
  );
}

function CategoryCard({
  category,
  subcategories,
}: {
  category: CategoryRow;
  subcategories: SubcategoryRowType[];
}) {
  const isDeleted = Boolean(category.deleted_at);
  return (
    <div className="border border-base-content/10 bg-base-100 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-base-content/10 bg-base-200/40 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderTree className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg uppercase tracking-[0.18em]">
              {category.name}
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-base-content/60">
              /{category.slug}
            </p>
          </div>
        </div>
        <StatusBadge active={!isDeleted} />
      </div>

      <form
        action={upsertCategory}
        encType="multipart/form-data"
        data-loading-message="Saving category…"
        className="grid grid-cols-1 gap-5 p-6 md:grid-cols-12"
      >
        <input type="hidden" name="id" value={category.id} />

        <Field
          icon={TypeIcon}
          label="Name"
          name="name"
          defaultValue={category.name}
          required
          className="md:col-span-5"
        />
        <Field
          icon={Tag}
          label="Slug"
          name="slug"
          defaultValue={category.slug}
          required
          helper="Used in /{slug} URL. Avoid changing after launch."
          className="md:col-span-3"
        />
        <Field
          icon={Hash}
          label="Order"
          name="sort_order"
          type="number"
          defaultValue={category.sort_order}
          className="md:col-span-2"
        />
        <Field
          icon={Sparkles}
          label="Tagline"
          name="tagline"
          defaultValue={category.tagline ?? ""}
          placeholder="A short one-liner"
          className="md:col-span-12"
        />

        <HeroImageField
          currentValue={category.hero_image}
          className="md:col-span-5"
        />

        <TextareaField
          icon={AlignLeft}
          label="Description"
          name="description"
          defaultValue={category.description ?? ""}
          rows={6}
          placeholder="Shown on the public landing for this category."
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
            Save category
          </button>
        </div>
      </form>

      <DangerZone
        id={category.id}
        isDeleted={isDeleted}
        action={deleteCategory}
        scope="category"
      />

      <div className="border-t border-base-content/10 bg-base-200/30 px-6 py-5">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-base-content/55" strokeWidth={1.75} aria-hidden />
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Subcategories
          </p>
          <span className="text-[10px] text-base-content/45">
            ({subcategories.length})
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {subcategories.length === 0 ? (
            <p className="text-[11px] italic text-base-content/45">
              No subcategories yet.
            </p>
          ) : (
            subcategories.map((subcategory) => (
              <SubcategoryRow key={subcategory.id} subcategory={subcategory} />
            ))
          )}
          <NewSubcategoryForm categoryId={category.id} />
        </div>
      </div>
    </div>
  );
}

function SubcategoryRow({ subcategory }: { subcategory: SubcategoryRowType }) {
  const isDeleted = Boolean(subcategory.deleted_at);
  return (
    <div className="border border-base-content/10 bg-base-100 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-base-content/55" strokeWidth={1.75} aria-hidden />
          <span className="font-display text-sm uppercase tracking-[0.18em]">
            {subcategory.name}
          </span>
          <span className="text-[10px] uppercase tracking-[0.24em] text-base-content/45">
            /{subcategory.slug}
          </span>
        </div>
        <StatusBadge active={!isDeleted} size="sm" />
      </div>

      <form
        action={upsertSubcategory}
        data-loading-message="Saving subcategory…"
        className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12"
      >
        <input type="hidden" name="id" value={subcategory.id} />
        <input type="hidden" name="category_id" value={subcategory.category_id} />
        <Field
          icon={TypeIcon}
          label="Name"
          name="name"
          defaultValue={subcategory.name}
          required
          className="md:col-span-3"
        />
        <Field
          icon={Tag}
          label="Slug"
          name="slug"
          defaultValue={subcategory.slug}
          required
          className="md:col-span-3"
        />
        <Field
          icon={Hash}
          label="Order"
          name="sort_order"
          type="number"
          defaultValue={subcategory.sort_order}
          className="md:col-span-2"
        />
        <Field
          icon={AlignLeft}
          label="Description"
          name="description"
          defaultValue={subcategory.description ?? ""}
          className="md:col-span-4"
        />
        <div className="md:col-span-12 flex flex-wrap items-center justify-end gap-2 border-t border-base-content/10 pt-3">
          {isDeleted ? (
            <InlineDangerAction
              action={deleteSubcategory}
              id={subcategory.id}
              mode="restore"
              tone="success"
              icon={RotateCcw}
              label="Restore"
            />
          ) : (
            <InlineDangerAction
              action={deleteSubcategory}
              id={subcategory.id}
              mode="soft"
              tone="warning"
              icon={ArrowDown}
              label="Soft delete"
            />
          )}
          <InlineDangerAction
            action={deleteSubcategory}
            id={subcategory.id}
            mode="hard"
            tone="error"
            icon={Trash2}
            label="Hard delete"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary-content transition hover:bg-primary/90"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function NewSubcategoryForm({ categoryId }: { categoryId: string }) {
  return (
    <form
      action={upsertSubcategory}
      data-loading-message="Adding subcategory…"
      className="grid grid-cols-1 gap-3 border border-dashed border-base-content/20 bg-base-100/60 p-4 md:grid-cols-12"
    >
      <input type="hidden" name="category_id" value={categoryId} />
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/55 md:col-span-12">
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        New subcategory
      </div>
      <Field
        icon={TypeIcon}
        label="Name"
        name="name"
        required
        className="md:col-span-4"
      />
      <Field
        icon={Tag}
        label="Slug"
        name="slug"
        required
        className="md:col-span-4"
      />
      <Field
        icon={Hash}
        label="Order"
        name="sort_order"
        type="number"
        defaultValue={0}
        className="md:col-span-2"
      />
      <div className="md:col-span-2 flex items-end justify-end">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 border border-base-content/30 px-3 py-2 text-xs uppercase tracking-[0.28em] transition hover:bg-base-content hover:text-base-100"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Add
        </button>
      </div>
    </form>
  );
}

function DangerZone({
  id,
  isDeleted,
  action,
  scope,
}: {
  id: string;
  isDeleted: boolean;
  action: (formData: FormData) => Promise<void>;
  scope: "category";
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-base-content/10 bg-base-200/30 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/55">
        <TriangleAlert className="h-3.5 w-3.5 text-warning" strokeWidth={1.75} aria-hidden />
        Danger zone · {scope}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isDeleted ? (
          <InlineDangerAction
            action={action}
            id={id}
            mode="restore"
            tone="success"
            icon={RotateCcw}
            label="Restore"
          />
        ) : (
          <InlineDangerAction
            action={action}
            id={id}
            mode="soft"
            tone="warning"
            icon={ArrowDown}
            label="Soft delete"
          />
        )}
        <InlineDangerAction
          action={action}
          id={id}
          mode="hard"
          tone="error"
          icon={Trash2}
          label="Hard delete"
        />
      </div>
    </div>
  );
}

function InlineDangerAction({
  action,
  id,
  mode,
  tone,
  icon: Icon,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  mode: "soft" | "restore" | "hard";
  tone: "success" | "warning" | "error";
  icon: LucideIcon;
  label: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    success:
      "border-success/40 text-success hover:bg-success hover:text-success-content",
    warning:
      "border-warning/40 text-warning hover:bg-warning hover:text-warning-content",
    error: "border-error/40 text-error hover:bg-error hover:text-error-content",
  };
  return (
    <form
      action={action}
      data-loading-message={`${label}…`}
      className="contents"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="mode" value={mode} />
      <button
        type="submit"
        className={`inline-flex items-center gap-2 border px-3 py-2 text-[11px] uppercase tracking-[0.28em] transition ${toneClasses[tone]}`}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </button>
    </form>
  );
}

function StatusBadge({
  active,
  size = "md",
}: {
  active: boolean;
  size?: "sm" | "md";
}) {
  const baseClass =
    size === "sm"
      ? "border px-2 py-0.5 text-[9px]"
      : "border px-3 py-1 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-2 self-start uppercase tracking-[0.24em] ${baseClass} ${
        active
          ? "border-success/40 bg-success/10 text-success-content"
          : "border-warning/40 bg-warning/10 text-warning-content"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-warning"}`}
        aria-hidden
      />
      {active ? "Active" : "Soft deleted"}
    </span>
  );
}

function NewCategoryForm() {
  return (
    <form
      action={upsertCategory}
      encType="multipart/form-data"
      data-loading-message="Creating category…"
      className="grid grid-cols-1 gap-5 border border-dashed border-base-content/25 bg-base-100/60 p-6 md:grid-cols-12"
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/55 md:col-span-12">
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        New category
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
        helper="/scuba, /freediving, etc."
        className="md:col-span-3"
      />
      <Field
        icon={Hash}
        label="Order"
        name="sort_order"
        type="number"
        defaultValue={0}
        className="md:col-span-2"
      />
      <Field
        icon={Sparkles}
        label="Tagline"
        name="tagline"
        className="md:col-span-12"
        placeholder="One-liner shown above the title"
      />
      <HeroImageField currentValue={null} className="md:col-span-5" />
      <TextareaField
        icon={AlignLeft}
        label="Description"
        name="description"
        rows={6}
        placeholder="Shown on the public landing for this category."
        className="md:col-span-7"
      />
      <div className="md:col-span-12 flex justify-end border-t border-base-content/10 pt-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-xs uppercase tracking-[0.28em] text-primary-content shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Create category
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
            {isExternal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentValue}
                alt="Current hero"
                className="h-full w-full object-cover"
              />
            ) : currentValue.startsWith("data:") ? (
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
