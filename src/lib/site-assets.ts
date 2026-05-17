import { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";

const SITE_ASSETS_BUCKET = "site-assets";

export const HERO_VIDEO_ACCEPT = ["video/mp4"] as const;
export const HERO_POSTER_ACCEPT = ["image/png", "image/jpeg"] as const;

export const HERO_VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
export const HERO_POSTER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type HeroKind = "video" | "poster";

function extensionForMime(mime: string): string {
  switch (mime) {
    case "video/mp4":
      return "mp4";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    default:
      return "bin";
  }
}

function buildObjectPath(kind: HeroKind, mime: string): string {
  const ext = extensionForMime(mime);
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `hero/${kind}-${stamp}-${rand}.${ext}`;
}

/**
 * Upload a hero asset (video or poster) to the public `site-assets` bucket and
 * return its public URL. Returns `null` when no file is provided so callers can
 * keep the previous URL untouched.
 *
 * Throws Error with a user-friendly message on validation failures.
 */
export async function uploadHeroAsset(
  supabase: SupabaseClient,
  entry: FormDataEntryValue | null,
  kind: HeroKind,
): Promise<string | null> {
  if (!(entry instanceof File)) return null;
  if (entry.size === 0) return null;

  const accept = kind === "video" ? HERO_VIDEO_ACCEPT : HERO_POSTER_ACCEPT;
  const maxBytes = kind === "video" ? HERO_VIDEO_MAX_BYTES : HERO_POSTER_MAX_BYTES;
  const acceptSet = new Set<string>(accept);

  if (!acceptSet.has(entry.type)) {
    const label = kind === "video" ? "MP4" : "PNG or JPEG";
    throw new Error(`Hero ${kind} must be a ${label} file.`);
  }
  if (entry.size > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`Hero ${kind} must be ${limitMb}MB or smaller.`);
  }

  const objectPath = buildObjectPath(kind, entry.type);
  const bytes = Buffer.from(await entry.arrayBuffer());

  const { error } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(objectPath, bytes, {
      contentType: entry.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Could not upload hero ${kind}: ${error.message}. Run the site-assets bucket migration if you haven't yet.`,
    );
  }

  const { data } = supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .getPublicUrl(objectPath);

  if (!data?.publicUrl) {
    throw new Error(`Upload succeeded but no public URL was returned for hero ${kind}.`);
  }

  return data.publicUrl;
}

/**
 * Remove a previously uploaded hero asset from the bucket. Best-effort: failures
 * are swallowed because the parent operation (saving settings) has already
 * succeeded and we don't want to surface storage-cleanup errors to the admin.
 */
export async function deleteHeroAssetByUrl(
  supabase: SupabaseClient,
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;
  const marker = `/storage/v1/object/public/${SITE_ASSETS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return; // Not one of ours (e.g. /media/hero.mp4 default).
  const objectPath = url.slice(index + marker.length).split("?")[0];
  if (!objectPath) return;
  try {
    await supabase.storage.from(SITE_ASSETS_BUCKET).remove([objectPath]);
  } catch {
    // ignore — non-fatal
  }
}
