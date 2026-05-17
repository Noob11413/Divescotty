import { phpAmountToCents } from "@/lib/utils";

export type PayoutMode = "percent" | "hourly";

export function normalizePayoutMode(raw: string): PayoutMode {
  return raw === "hourly" ? "hourly" : "percent";
}

export function parsePayoutPercent(formData: FormData): number {
  return Math.max(
    0,
    Math.min(100, Number(formData.get("payout_percent") ?? 30) || 30),
  );
}

export function parseHourlyRateCents(formData: FormData, field: string): number | null {
  const raw = String(formData.get(field) ?? "").trim();
  if (!raw) return null;
  const cents = phpAmountToCents(raw);
  return cents > 0 ? cents : null;
}

export function validatePayoutFields(
  mode: PayoutMode,
  payoutPercent: number,
  hourlyRateCents: number | null,
): void {
  if (mode === "hourly") {
    if (hourlyRateCents == null || hourlyRateCents <= 0) {
      throw new Error("Hourly rate (PHP) is required for hourly payout mode.");
    }
    return;
  }
  if (payoutPercent <= 0) {
    throw new Error("Payout percent must be greater than 0 for percent payout mode.");
  }
}

export function payoutPayloadForMode(
  mode: PayoutMode,
  payoutPercent: number,
  hourlyRateCents: number | null,
  overtimeHourlyRateCents: number | null,
) {
  if (mode === "hourly") {
    return {
      payout_mode: "hourly" as const,
      payout_percent: 30,
      hourly_rate_cents: hourlyRateCents,
      overtime_hourly_rate_cents: overtimeHourlyRateCents,
    };
  }
  return {
    payout_mode: "percent" as const,
    payout_percent: payoutPercent,
    hourly_rate_cents: null,
    overtime_hourly_rate_cents: null,
  };
}
