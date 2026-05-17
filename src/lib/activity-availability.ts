const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const LABEL_SPLIT = /\s+to\s+/i;

/** Matches admin `availability_label` format: `YYYY-MM-DD to YYYY-MM-DD`. */
export function parseAvailabilityLabel(
  label: string | null | undefined,
): { start: string; end: string } | null {
  if (!label?.trim()) return null;
  const [startRaw, endRaw] = label.trim().split(LABEL_SPLIT).map((v) => v.trim());
  if (!startRaw || !endRaw) return null;
  if (!DATE_ONLY.test(startRaw) || !DATE_ONLY.test(endRaw)) return null;
  return { start: startRaw, end: endRaw };
}

/** Calendar date in the Philippines (site operating timezone). */
export function todayDateOnly(timeZone = "Asia/Manila"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Whether an activity should appear in date-gated listings.
 * No label or unparseable label → always active (open-ended featured trips).
 */
export function isActivityAvailabilityActive(
  label: string | null | undefined,
  today = todayDateOnly(),
): boolean {
  const range = parseAvailabilityLabel(label);
  if (!range) return true;
  return today >= range.start && today <= range.end;
}
