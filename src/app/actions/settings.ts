"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertSiteSettings(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payload = {
    business_name: String(formData.get("business_name") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
    timezone: String(formData.get("timezone") ?? "Asia/Manila").trim(),
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("site_settings")
      .update(payload as never)
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("site_settings").insert(payload as never);
    if (error) throw error;
  }

  revalidatePath("/admin/settings");
  revalidatePath("/booking/confirmation");
}
