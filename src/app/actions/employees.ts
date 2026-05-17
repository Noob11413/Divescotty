"use server";

import { revalidatePath } from "next/cache";
import { Buffer } from "node:buffer";
import { createClient } from "@/lib/supabase/server";
import type { FlashKey } from "@/lib/admin-flash";
import {
  getEmployeeCodePrefix,
  nextEmployeeCodeForPrefix,
  parseEmployeeRole,
} from "@/lib/employee-code";
import {
  normalizePayoutMode,
  parseHourlyRateCents,
  parsePayoutPercent,
  payoutPayloadForMode,
  validatePayoutFields,
} from "@/lib/employee-payout";
import {
  redirectWithFlash,
  redirectWithFlashErrorFromCatch,
} from "@/lib/redirect-with-flash";
import type { SupabaseClient } from "@supabase/supabase-js";

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

async function loadExistingEmployeeCode(
  supabase: SupabaseClient,
  id: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_code")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  const row = data as { employee_code?: string } | null;
  if (!row?.employee_code) {
    throw new Error("Employee not found.");
  }
  return row.employee_code;
}

async function generateEmployeeCode(
  supabase: SupabaseClient,
  role: string,
): Promise<string> {
  const parsedRole = parseEmployeeRole(role);
  const prefix = getEmployeeCodePrefix(parsedRole);
  const { data, error } = await supabase.from("employees").select("employee_code");
  if (error) throw error;
  const codes = ((data ?? []) as Array<{ employee_code: string }>).map(
    (row) => row.employee_code,
  );
  return nextEmployeeCodeForPrefix(prefix, codes);
}

export async function upsertEmployee(formData: FormData) {
  const path = "/admin/employees";
  try {
    const id = (formData.get("id") as string | null) || undefined;
    const isCreate = !id;
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    const name = buildDisplayName(firstName, lastName);
    const role = String(formData.get("role") ?? "employee").trim();
    const phone = (formData.get("phone") as string | null)?.trim() || null;
    const email = (formData.get("email") as string | null)?.trim() || null;
    const expertiseLevel =
      (formData.get("expertise_level") as string | null)?.trim() || null;
    const certifications =
      (formData.get("certifications") as string | null)?.trim() || null;
    const isActive = formData.get("is_active") === "on";
    const payoutMode = normalizePayoutMode(
      String(formData.get("payout_mode") ?? "percent"),
    );
    const payoutPercent = parsePayoutPercent(formData);
    const hourlyRateCents = parseHourlyRateCents(formData, "hourly_rate_php");
    const overtimeHourlyRateCents = parseHourlyRateCents(
      formData,
      "overtime_hourly_rate_php",
    );

    if (!firstName && !lastName) {
      throw new Error("First name or surname is required.");
    }

    validatePayoutFields(payoutMode, payoutPercent, hourlyRateCents);

    const supabase = await createClient();
    const employeeCode = isCreate
      ? await generateEmployeeCode(supabase, role)
      : await loadExistingEmployeeCode(supabase, id!);

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

    const payoutFields = payoutPayloadForMode(
      payoutMode,
      payoutPercent,
      hourlyRateCents,
      overtimeHourlyRateCents,
    );

    const payload = {
      id,
      employee_code: employeeCode,
      name,
      first_name: firstName || null,
      last_name: lastName || null,
      role: parseEmployeeRole(role),
      photo_url: photoUrl,
      credentials_url: credentialsUrl,
      expertise_level: expertiseLevel,
      certifications: certifications,
      phone,
      email,
      is_active: isActive,
      ...payoutFields,
    };

    let upsertError: { code?: string; message: string } | null = null;
    let code = employeeCode;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase
        .from("employees")
        .upsert({ ...payload, employee_code: code } as never);
      if (!error) {
        upsertError = null;
        break;
      }
      if (
        isCreate &&
        error.code === "23505" &&
        error.message.includes("employee_code")
      ) {
        code = await generateEmployeeCode(supabase, role);
        continue;
      }
      upsertError = error;
      break;
    }
    if (upsertError) throw upsertError;

    revalidatePath("/admin/employees");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");
    revalidatePath("/");

    redirectWithFlash(
      path,
      isCreate ? "employee_created" : "employee_updated",
    );
  } catch (err) {
    redirectWithFlashErrorFromCatch(
      path,
      err,
      "Could not save employee.",
    );
  }
}

export async function deleteEmployee(formData: FormData) {
  const path = "/admin/employees";
  const id = String(formData.get("id") ?? "");
  const mode = String(formData.get("mode") ?? "soft");
  if (!id) return;

  let flash: FlashKey = "employee_deactivated";
  try {
    const supabase = await createClient();
    if (mode === "restore") {
      await supabase
        .from("employees")
        .update({ is_active: true } as never)
        .eq("id", id);
      flash = "employee_restored";
    } else if (mode === "hard") {
      const hardDelete = await supabase.from("employees").delete().eq("id", id);
      if (hardDelete.error) {
        throw new Error(
          hardDelete.error.code === "23503"
            ? "Hard delete blocked: this employee is still linked to bookings."
            : `Hard delete failed: ${hardDelete.error.message}`,
        );
      }
      flash = "employee_deleted";
    } else {
      await supabase
        .from("employees")
        .update({ is_active: false } as never)
        .eq("id", id);
      flash = "employee_deactivated";
    }

    revalidatePath("/admin/employees");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin");
    redirectWithFlash(path, flash);
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Employee action failed.");
  }
}
