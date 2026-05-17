"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  redirectWithFlash,
  redirectWithFlashErrorFromCatch,
} from "@/lib/redirect-with-flash";
import { phpAmountToCents } from "@/lib/utils";

const toCents = (raw: string) => phpAmountToCents(raw);

function isSchemaColumnMissingError(err: unknown): boolean {
  if (err == null || typeof err !== "object") return false;
  const o = err as { code?: unknown; message?: unknown };
  if (typeof o.code === "string" && o.code === "PGRST204") return true;
  if (typeof o.message !== "string") return false;
  return (
    o.message.includes("Could not find the '") && o.message.includes("' column")
  );
}

export async function upsertActivityCostTemplate(formData: FormData) {
  const path = "/admin/cost-templates";
  try {
  const activityId = String(formData.get("activity_id") ?? "");
  if (!activityId) throw new Error("Missing activity id.");

  const fuel = toCents(String(formData.get("default_fuel_cost_php") ?? "0"));
  const fuelHourly = toCents(String(formData.get("default_fuel_hourly_cost_php") ?? "0"));
  const tankQty = Math.max(0, Number(formData.get("default_tank_qty") ?? 0) || 0);
  const tankUnit = toCents(String(formData.get("default_tank_unit_cost_php") ?? "0"));
  const gearQty = Math.max(0, Number(formData.get("default_gear_qty") ?? 0) || 0);
  const gearUnit = toCents(String(formData.get("default_gear_unit_cost_php") ?? "0"));
  const tank = Math.round(tankQty * tankUnit);
  const gear = Math.round(gearQty * gearUnit);
  const other = toCents(String(formData.get("default_other_cost_php") ?? "0"));
  const hours = Math.max(0, Number(formData.get("default_instructor_hours") ?? 0) || 0);

  const supabase = await createClient();

  const payloads: Record<string, string | number>[] = [
    {
      activity_id: activityId,
      default_fuel_cost_cents: fuel,
      default_fuel_hourly_cost_cents: fuelHourly,
      default_tank_cost_cents: tank,
      default_tank_qty: tankQty,
      default_tank_unit_cost_cents: tankUnit,
      default_gear_cost_cents: gear,
      default_gear_qty: gearQty,
      default_gear_unit_cost_cents: gearUnit,
      default_other_cost_cents: other,
      default_instructor_hours: hours,
    },
    {
      activity_id: activityId,
      default_fuel_cost_cents: fuel,
      default_fuel_hourly_cost_cents: fuelHourly,
      default_tank_cost_cents: tank,
      default_gear_cost_cents: gear,
      default_other_cost_cents: other,
      default_instructor_hours: hours,
    },
    {
      activity_id: activityId,
      default_fuel_cost_cents: fuel,
      default_tank_cost_cents: tank,
      default_gear_cost_cents: gear,
      default_other_cost_cents: other,
      default_instructor_hours: hours,
    },
  ];

  let lastError: unknown;

  for (const row of payloads) {
    let result: { error: unknown };
    try {
      result = await supabase
        .from("activity_cost_templates")
        .upsert(row as never, { onConflict: "activity_id" });
    } catch (e) {
      lastError = e;
      if (!isSchemaColumnMissingError(e)) throw e;
      continue;
    }

    if (!result.error) {
      revalidatePath("/admin/cost-templates");
      revalidatePath("/admin/bookings");
      redirectWithFlash(path, "cost_template_saved");
    }

    lastError = result.error;
    if (!isSchemaColumnMissingError(result.error)) {
      throw result.error;
    }
  }

  throw lastError;
  } catch (err) {
    redirectWithFlashErrorFromCatch(path, err, "Could not save cost template.");
  }
}
