"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  redirectWithFlash,
  redirectWithFlashErrorFromCatch,
} from "@/lib/redirect-with-flash";
import { deleteHeroAssetByUrl, uploadHeroAsset } from "@/lib/site-assets";

export async function upsertSiteSettings(formData: FormData) {
  const path = "/admin/settings";
  try {
    const id = String(formData.get("id") ?? "");
    const nullable = (key: string): string | null => {
      const value = String(formData.get(key) ?? "").trim();
      return value === "" ? null : value;
    };

    const supabase = await createClient();

    const currentVideoUrl = nullable("hero_video_url_current");
    const currentPosterUrl = nullable("hero_poster_url_current");

    const removeVideo = formData.get("hero_video_remove") === "1";
    const removePoster = formData.get("hero_poster_remove") === "1";

    const uploadedVideoUrl = removeVideo
      ? null
      : await uploadHeroAsset(supabase, formData.get("hero_video_file"), "video");
    const uploadedPosterUrl = removePoster
      ? null
      : await uploadHeroAsset(supabase, formData.get("hero_poster_file"), "poster");

    const heroVideoUrl = removeVideo
      ? null
      : (uploadedVideoUrl ?? currentVideoUrl);
    const heroPosterUrl = removePoster
      ? null
      : (uploadedPosterUrl ?? currentPosterUrl);

    const payload = {
      business_name: String(formData.get("business_name") ?? "").trim(),
      contact_email: String(formData.get("contact_email") ?? "").trim(),
      whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
      timezone: String(formData.get("timezone") ?? "Asia/Manila").trim(),
      hero_eyebrow: nullable("hero_eyebrow"),
      hero_title: nullable("hero_title"),
      hero_subtitle: nullable("hero_subtitle"),
      hero_video_url: heroVideoUrl,
      hero_poster_url: heroPosterUrl,
      hero_primary_cta_label: nullable("hero_primary_cta_label"),
      hero_primary_cta_href: nullable("hero_primary_cta_href"),
      hero_secondary_cta_label: nullable("hero_secondary_cta_label"),
      hero_secondary_cta_href: nullable("hero_secondary_cta_href"),
    };

    if (id) {
      const { error } = await supabase
        .from("site_settings")
        .update(payload as never)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("site_settings")
        .insert(payload as never);
      if (error) throw error;
    }

    // Best-effort cleanup of replaced files (only the ones we previously uploaded).
    if (removeVideo && currentVideoUrl) {
      await deleteHeroAssetByUrl(supabase, currentVideoUrl);
    } else if (
      uploadedVideoUrl &&
      currentVideoUrl &&
      currentVideoUrl !== uploadedVideoUrl
    ) {
      await deleteHeroAssetByUrl(supabase, currentVideoUrl);
    }
    if (removePoster && currentPosterUrl) {
      await deleteHeroAssetByUrl(supabase, currentPosterUrl);
    } else if (
      uploadedPosterUrl &&
      currentPosterUrl &&
      currentPosterUrl !== uploadedPosterUrl
    ) {
      await deleteHeroAssetByUrl(supabase, currentPosterUrl);
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/booking/confirmation");
    redirectWithFlash(path, "settings_saved");
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Could not save settings.");
  }
}
