"use server";

import { revalidatePath } from "next/cache";
import { Buffer } from "node:buffer";
import { createClient } from "@/lib/supabase/server";

async function getUploadValue(
  formData: FormData,
  fileField: string,
  currentField: string,
  allowedTypes: string[],
  maxBytes: number,
  errorMessage: string,
) {
  const currentValue = (formData.get(currentField) as string | null) || null;
  const entry = formData.get(fileField);
  if (!(entry instanceof File)) return currentValue;
  if (entry.size === 0) return currentValue;

  const allowed = new Set(allowedTypes);
  if (!allowed.has(entry.type)) throw new Error(errorMessage);
  if (entry.size > maxBytes) throw new Error(`File must be ${Math.round(maxBytes / (1024 * 1024))}MB or smaller.`);

  const bytes = Buffer.from(await entry.arrayBuffer());
  return `data:${entry.type};base64,${bytes.toString("base64")}`;
}

function buildDisplayName(firstName: string, lastName: string) {
  const full = `${firstName} ${lastName}`.trim();
  return full || "Unnamed Employee";
}

export async function upsertEmployee(formData: FormData) {
  const id = (formData.get("id") as string | null) || undefined;
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const name = buildDisplayName(firstName, lastName);
  const employeeCode = String(formData.get("employee_code") ?? "").trim();
  const role = String(formData.get("role") ?? "employee").trim();
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const expertiseLevel =
    (formData.get("expertise_level") as string | null)?.trim() || null;
  const certifications =
    (formData.get("certifications") as string | null)?.trim() || null;
  const isActive = formData.get("is_active") === "on";
  const payoutMode = String(formData.get("payout_mode") ?? "percent").trim();
  const payoutPercent = Math.max(
    0,
    Math.min(100, Number(formData.get("payout_percent") ?? 30) || 30),
  );
  const hourlyRateCents = (() => {
    const raw = String(formData.get("hourly_rate_php") ?? "").trim();
    if (!raw) return null;
    return Math.round(Math.max(0, Number(raw) || 0) * 100);
  })();
  const overtimeHourlyRateCents = (() => {
    const raw = String(formData.get("overtime_hourly_rate_php") ?? "").trim();
    if (!raw) return null;
    return Math.round(Math.max(0, Number(raw) || 0) * 100);
  })();

  if (!employeeCode) throw new Error("Employee code is required.");
  if (!firstName && !lastName) throw new Error("First name or surname is required.");

  const photoUrl = await getUploadValue(
    formData,
    "photo_file",
    "photo_current",
    ["image/png", "image/jpeg"],
    4 * 1024 * 1024,
    "Photo must be PNG or JPEG.",
  );
  const credentialsUrl = await getUploadValue(
    formData,
    "credentials_file",
    "credentials_current",
    ["application/pdf"],
    8 * 1024 * 1024,
    "Credentials file must be a PDF.",
  );

  const supabase = await createClient();
  const payload = {
    id,
    employee_code: employeeCode,
    name,
    first_name: firstName || null,
    last_name: lastName || null,
    role: role as "employee" | "tourguide" | "scubaguide" | "instructor",
    photo_url: photoUrl,
    credentials_url: credentialsUrl,
    expertise_level: expertiseLevel,
    certifications: certifications,
    phone,
    email,
    is_active: isActive,
    payout_mode: (payoutMode === "hourly" ? "hourly" : "percent") as
      | "percent"
      | "hourly",
    payout_percent: payoutPercent,
    hourly_rate_cents: hourlyRateCents,
    overtime_hourly_rate_cents: overtimeHourlyRateCents,
  };

  const { error } = await supabase.from("employees").upsert(payload as never);
  if (error) throw error;

  revalidatePath("/admin/employees");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteEmployee(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const mode = String(formData.get("mode") ?? "soft");
  if (!id) return;

  const supabase = await createClient();
  if (mode === "restore") {
    await supabase
      .from("employees")
      .update({ is_active: true } as never)
      .eq("id", id);
  } else if (mode === "hard") {
    const hardDelete = await supabase.from("employees").delete().eq("id", id);
    if (hardDelete.error) {
      throw new Error(
        hardDelete.error.code === "23503"
          ? "Hard delete blocked: this employee is still linked to bookings."
          : `Hard delete failed: ${hardDelete.error.message}`,
      );
    }
  } else {
    await supabase
      .from("employees")
      .update({ is_active: false } as never)
      .eq("id", id);
  }

  revalidatePath("/admin/employees");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}
