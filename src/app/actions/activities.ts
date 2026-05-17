"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FlashKey } from "@/lib/admin-flash";
import {
  redirectWithFlash,
  redirectWithFlashErrorFromCatch,
  rethrowIfRedirect,
} from "@/lib/redirect-with-flash";
import { activityFormSchema } from "@/lib/validators";
import { Buffer } from "node:buffer";
import type { Database } from "@/lib/supabase/database.types";

export interface ActivityActionState {
  ok?: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

type ActivityUpsertPayload = Database["public"]["Tables"]["activities"]["Insert"];
type ActivityLocationInsert =
  Database["public"]["Tables"]["activity_locations"]["Insert"];
type CategoryUpsertPayload = Database["public"]["Tables"]["categories"]["Insert"];
type SubcategoryUpsertPayload =
  Database["public"]["Tables"]["subcategories"]["Insert"];
type LocationUpsertPayload = Database["public"]["Tables"]["locations"]["Insert"];

function parseLocationIds(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getHeroImageValue(
  formData: FormData,
  fileField: string,
  currentField: string,
) {
  const currentValue = (formData.get(currentField) as string | null) || null;
  const entry = formData.get(fileField);
  if (!(entry instanceof File)) return currentValue;
  if (entry.size === 0) return currentValue;

  const allowed = new Set(["image/png", "image/jpeg"]);
  if (!allowed.has(entry.type)) {
    throw new Error("Image must be PNG or JPEG.");
  }

  const maxBytes = 3 * 1024 * 1024;
  if (entry.size > maxBytes) {
    throw new Error("Image must be 3MB or smaller.");
  }

  const bytes = Buffer.from(await entry.arrayBuffer());
  return `data:${entry.type};base64,${bytes.toString("base64")}`;
}

export async function upsertActivity(
  _prev: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  let imageUrl: string | null;
  try {
    imageUrl = await getHeroImageValue(formData, "image_file", "image_current");
  } catch (err) {
    rethrowIfRedirect(err);
    return {
      ok: false,
      formError: err instanceof Error ? err.message : "Image upload failed",
    };
  }

  const raw = {
    id: (formData.get("id") as string | null) || undefined,
    slug: String(formData.get("slug") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    subcategoryId: String(formData.get("subcategoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    shortDescription: (formData.get("shortDescription") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    durationMinutes: formData.get("durationMinutes")
      ? Number(formData.get("durationMinutes"))
      : undefined,
    pricePhp: formData.get("pricePhp") ? Number(formData.get("pricePhp")) : undefined,
    minParty: Number(formData.get("minParty") ?? 1),
    maxParty: Number(formData.get("maxParty") ?? 20),
    imageUrl: imageUrl ?? "",
    availabilityStart: (formData.get("availabilityStart") as string | null) ?? "",
    availabilityEnd: (formData.get("availabilityEnd") as string | null) ?? "",
    isPublished: formData.get("isPublished") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    locationIds: parseLocationIds(formData.get("locationIds")),
  };

  const parsed = activityFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString();
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const data = parsed.data;
  const supabase = await createClient();
  let subcategoryId: string | null = data.subcategoryId || null;
  if (subcategoryId) {
    const { data: subcategoryRow } = await supabase
      .from("subcategories")
      .select("id, category_id, deleted_at")
      .eq("id", subcategoryId)
      .maybeSingle();
    const subcategory = subcategoryRow as
      | { id: string; category_id: string; deleted_at: string | null }
      | null;
    if (
      !subcategory ||
      subcategory.category_id !== data.categoryId ||
      subcategory.deleted_at
    ) {
      subcategoryId = null;
    }
  }
  const availabilityLabel =
    data.availabilityStart && data.availabilityEnd
      ? `${data.availabilityStart} to ${data.availabilityEnd}`
      : null;

  const upsertPayload: ActivityUpsertPayload = {
    id: data.id,
    slug: data.slug,
    category_id: data.categoryId,
    subcategory_id: subcategoryId,
    name: data.name,
    short_description: data.shortDescription || null,
    description: data.description || null,
    duration_minutes: data.durationMinutes ?? null,
    price_cents:
      data.pricePhp != null ? Math.round(data.pricePhp * 100) : null,
    min_party: data.minParty,
    max_party: data.maxParty,
    image_url: data.imageUrl || null,
    availability_label: availabilityLabel,
    is_published: data.isPublished,
    is_featured: data.isFeatured,
    sort_order: data.sortOrder,
  };

  const { data: savedData, error } = await supabase
    .from("activities")
    .upsert(upsertPayload as never)
    .select("id")
    .single();
  const saved = savedData as { id: string } | null;

  if (error || !saved) {
    return { ok: false, formError: error?.message ?? "Save failed" };
  }

  await supabase
    .from("activity_locations")
    .delete()
    .eq("activity_id", saved.id);

  if (data.locationIds.length > 0) {
    const locationRows = data.locationIds.map((lid) => ({
      activity_id: saved.id,
      location_id: lid,
    })) as ActivityLocationInsert[];
    await supabase.from("activity_locations").insert(
      locationRows as never,
    );
  }

  revalidatePath("/admin/activities");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteActivity(formData: FormData) {
  const path = "/admin/activities";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/activities");
    revalidatePath("/");
    redirectWithFlash(path, "activity_deleted");
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Could not delete activity.");
  }
}

export async function upsertCategory(formData: FormData) {
  const path = "/admin/categories";
  const id = (formData.get("id") as string | null) || undefined;
  const isCreate = !id;
  try {
  const supabase = await createClient();
  const heroImage = await getHeroImageValue(
    formData,
    "hero_image_file",
    "hero_image_current",
  );
  const rawSortOrder = Number(formData.get("sort_order") ?? 0);
  let sortOrder = rawSortOrder;
  if (!id && rawSortOrder === 0) {
    const { data: lastCategoryData } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastCategory = lastCategoryData as { sort_order: number } | null;
    sortOrder = (lastCategory?.sort_order ?? -1) + 1;
  }

  const payload: CategoryUpsertPayload = {
    id,
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    tagline: (formData.get("tagline") as string | null) || null,
    description: (formData.get("description") as string | null) || null,
    hero_image: heroImage,
    sort_order: sortOrder,
  };
  const { error } = await supabase.from("categories").upsert(payload as never);
  if (error) throw error;
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirectWithFlash(
    path,
    isCreate ? "category_created" : "category_updated",
  );
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Could not save category.");
  }
}

export async function deleteCategory(formData: FormData) {
  const path = "/admin/categories";
  const id = String(formData.get("id") ?? "");
  const mode = String(formData.get("mode") ?? "soft");
  if (!id) return;

  let flash: FlashKey = "category_deactivated";
  try {
  const supabase = await createClient();
  if (mode === "restore") {
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: null } as never)
      .eq("id", id);
    if (error) {
      throw new Error(
        error.message.includes("deleted_at")
          ? "Restore failed: run the category soft-delete migration first."
          : `Restore failed: ${error.message}`,
      );
    }
    flash = "category_restored";
  } else if (mode === "hard") {
    const hardDelete = await supabase.from("categories").delete().eq("id", id);
    if (hardDelete.error) {
      throw new Error(
        hardDelete.error.code === "23503"
          ? "Hard delete blocked: this category still has linked activities. Soft delete it or move/delete those activities first."
          : `Hard delete failed: ${hardDelete.error.message}`,
      );
    }
    flash = "category_deleted";
  } else {
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", id);
    if (error) {
      throw new Error(
        error.message.includes("deleted_at")
          ? "Soft delete failed: run the category soft-delete migration first."
          : `Soft delete failed: ${error.message}`,
      );
    }
    flash = "category_deactivated";
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirectWithFlash(path, flash);
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Category action failed.");
  }
}

export async function upsertLocation(formData: FormData) {
  const path = "/admin/locations";
  try {
  const id = (formData.get("id") as string | null) || undefined;
  const supabase = await createClient();
  const heroImage = await getHeroImageValue(
    formData,
    "hero_image_file",
    "hero_image_current",
  );
  const payload: LocationUpsertPayload = {
    id,
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    region: (formData.get("region") as string | null) || null,
    description: (formData.get("description") as string | null) || null,
    hero_image: heroImage,
    sort_order: Number(formData.get("sort_order") ?? 0),
  };
  const { error } = await supabase.from("locations").upsert(payload as never);
  if (error) throw error;
  revalidatePath("/admin/locations");
  revalidatePath("/");
  redirectWithFlash(path, "location_saved");
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Could not save location.");
  }
}

export async function upsertSubcategory(formData: FormData) {
  const path = "/admin/categories";
  const id = (formData.get("id") as string | null) || undefined;
  const isCreate = !id;
  const categoryId = String(formData.get("category_id") ?? "");
  if (!categoryId) throw new Error("Missing category_id");

  try {
  const supabase = await createClient();
  const rawSortOrder = Number(formData.get("sort_order") ?? 0);
  let sortOrder = rawSortOrder;
  if (!id && rawSortOrder === 0) {
    const { data: lastData } = await supabase
      .from("subcategories")
      .select("sort_order")
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const last = lastData as { sort_order: number } | null;
    sortOrder = (last?.sort_order ?? -1) + 1;
  }

  const payload: SubcategoryUpsertPayload = {
    id,
    category_id: categoryId,
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: (formData.get("description") as string | null) || null,
    sort_order: sortOrder,
  };
  const { error } = await supabase.from("subcategories").upsert(payload as never);
  if (error) throw error;
  revalidatePath("/admin/categories");
  revalidatePath("/admin/activities");
  revalidatePath("/");
  redirectWithFlash(
    path,
    isCreate ? "subcategory_created" : "subcategory_updated",
  );
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Could not save subcategory.");
  }
}

export async function deleteSubcategory(formData: FormData) {
  const path = "/admin/categories";
  const id = String(formData.get("id") ?? "");
  const mode = String(formData.get("mode") ?? "soft");
  if (!id) return;

  let flash: FlashKey = "subcategory_deactivated";
  try {
  const supabase = await createClient();
  if (mode === "restore") {
    await supabase
      .from("subcategories")
      .update({ deleted_at: null } as never)
      .eq("id", id);
    flash = "subcategory_restored";
  } else if (mode === "hard") {
    const hardDelete = await supabase.from("subcategories").delete().eq("id", id);
    if (hardDelete.error) {
      throw new Error(`Hard delete failed: ${hardDelete.error.message}`);
    }
    flash = "subcategory_deleted";
  } else {
    await supabase
      .from("subcategories")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", id);
    flash = "subcategory_deactivated";
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/activities");
  revalidatePath("/");
  redirectWithFlash(path, flash);
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Subcategory action failed.");
  }
}
