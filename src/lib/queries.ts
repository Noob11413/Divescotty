import { isActivityAvailabilityActive } from "@/lib/activity-availability";
import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  Category,
  Location,
} from "@/lib/supabase/database.types";

/** Public-facing subcategory (soft-deleted rows are stripped in flatten). */
export type ActivitySubcategory = {
  slug: string;
  name: string;
  sort_order: number;
};

export type ActivityWithRelations = Activity & {
  category: Pick<Category, "slug" | "name"> | null;
  subcategory: ActivitySubcategory | null;
  locations: Pick<Location, "slug" | "name">[];
};

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const scoped = await supabase
    .from("categories")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order");
  if (!scoped.error) return (scoped.data ?? []) as Category[];

  // Backward-compat for databases that have not run the soft-delete migration yet.
  const fallback = await supabase.from("categories").select("*").order("sort_order");
  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []) as Category[];
}

export type NavSubcategory = {
  slug: string;
  name: string;
  sort_order: number;
};

/** All non-deleted subcategories for nav grouping (key by category_id). */
export async function getSubcategoriesForNav() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("category_id, slug, name, sort_order")
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Array<{
    category_id: string;
    slug: string;
    name: string;
    sort_order: number;
  }>;
}

export async function getSubcategoriesByCategoryId(categoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, slug, name, sort_order, description")
    .eq("category_id", categoryId)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    sort_order: number;
    description: string | null;
  }>;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const scoped = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!scoped.error) return scoped.data;

  // Backward-compat for databases that have not run the soft-delete migration yet.
  const fallback = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return fallback.data;
}

export async function getLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getLocationBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const ACTIVITY_SELECT = `
  *,
  category:categories!inner(slug, name),
  subcategory:subcategories(slug, name, sort_order, deleted_at),
  activity_locations!left(location:locations(slug, name))
`;

type RawActivityRow = Activity & {
  category: { slug: string; name: string } | null;
  subcategory: {
    slug: string;
    name: string;
    sort_order: number;
    deleted_at: string | null;
  } | null;
  activity_locations:
    | { location: { slug: string; name: string } | null }[]
    | null;
};

function publicSubcategory(
  row: RawActivityRow["subcategory"],
): ActivitySubcategory | null {
  if (!row || row.deleted_at) return null;
  return {
    slug: row.slug,
    name: row.name,
    sort_order: row.sort_order,
  };
}

function sortActivitiesForCatalog(a: ActivityWithRelations, b: ActivityWithRelations) {
  const sa = a.subcategory?.sort_order ?? 1_000_000;
  const sb = b.subcategory?.sort_order ?? 1_000_000;
  if (sa !== sb) return sa - sb;
  return a.sort_order - b.sort_order;
}

function flattenActivity(row: RawActivityRow): ActivityWithRelations {
  return {
    ...row,
    subcategory: publicSubcategory(row.subcategory),
    locations:
      row.activity_locations
        ?.map((al) => al.location)
        .filter((l): l is { slug: string; name: string } => Boolean(l)) ?? [],
  };
}

export async function getFeaturedActivities(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(limit);
  if (error) throw error;
  const rows = (data as unknown as RawActivityRow[] | null)?.map(flattenActivity) ?? [];
  const active = rows.filter((row) =>
    isActivityAvailabilityActive(row.availability_label),
  );
  active.sort(sortActivitiesForCatalog);
  return active;
}

export async function getActivitiesByCategorySlug(categorySlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("is_published", true)
    .eq("category.slug", categorySlug)
    .order("sort_order");
  if (error) throw error;
  const rows = (data as unknown as RawActivityRow[] | null)?.map(flattenActivity) ?? [];
  rows.sort(sortActivitiesForCatalog);
  return rows;
}

export async function getActivityBySlug(
  categorySlug: string,
  activitySlug: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("slug", activitySlug)
    .eq("is_published", true)
    .eq("category.slug", categorySlug)
    .limit(1);
  if (error) throw error;
  const first = (data as unknown as RawActivityRow[] | null)?.[0] ?? null;
  return first ? flattenActivity(first) : null;
}

export async function getActivitiesAtLocation(locationSlug: string) {
  const supabase = await createClient();
  const { data: loc, error: locErr } = await supabase
    .from("locations")
    .select("id, slug, name")
    .eq("slug", locationSlug)
    .maybeSingle();
  if (locErr) throw locErr;
  if (!loc) return [];

  // Two-step: PostgREST struggles when the same relation appears in both the
  // SELECT (for embedding) and a filter (for inner-joining), so we fetch the
  // activity ids first and then load the rich rows by id.
  const { data: links, error: linkErr } = await supabase
    .from("activity_locations")
    .select("activity_id")
    .eq("location_id", loc.id);
  if (linkErr) throw linkErr;

  const activityIds = (links ?? []).map((l) => l.activity_id);
  if (activityIds.length === 0) return [];

  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("is_published", true)
    .in("id", activityIds)
    .order("sort_order");
  if (error) throw error;

  const rows =
    (data as unknown as RawActivityRow[] | null)?.map(flattenActivity) ?? [];
  rows.sort(sortActivitiesForCatalog);
  return rows;
}
