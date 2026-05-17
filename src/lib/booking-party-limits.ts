/** Global limits for booking party size (public forms + server validation). */
export const PARTY_SIZE_MIN = 2;
export const PARTY_SIZE_MAX = 20;

/**
 * Custom booking requests support much larger groups (school outings,
 * corporate retreats, charters). Standard activity bookings stay at PARTY_SIZE_MAX.
 */
export const CUSTOM_PARTY_SIZE_MIN = 1;
export const CUSTOM_PARTY_SIZE_MAX = 100;

/**
 * Default party size on booking forms: midpoint of the activity’s advertised
 * range, clamped into 2–20. Works even when activity data is degenerate (e.g.
 * 20–20 after bad imports).
 */
export function defaultPartySizeForBooking(minParty: number, maxParty: number): number {
  const lo = Math.max(PARTY_SIZE_MIN, Math.min(PARTY_SIZE_MAX, minParty));
  const hi = Math.min(PARTY_SIZE_MAX, Math.max(PARTY_SIZE_MIN, maxParty));
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  if (a > b) return PARTY_SIZE_MIN;
  const mid = Math.round((a + b) / 2);
  return Math.min(b, Math.max(a, mid));
}

/**
 * Short label for marketing (e.g. activity page). If the stored range collapses
 * to only “2” or only “20”, show the full bookable 2–20 instead of a misleading
 * single value.
 */
export function formatActivityPartyRangeLabel(minParty: number, maxParty: number): string {
  const lo = Math.max(PARTY_SIZE_MIN, Math.min(PARTY_SIZE_MAX, minParty));
  const hi = Math.min(PARTY_SIZE_MAX, Math.max(PARTY_SIZE_MIN, maxParty));
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  if (a > b) return `${PARTY_SIZE_MIN}–${PARTY_SIZE_MAX}`;
  if (a === b && (a === PARTY_SIZE_MAX || a === PARTY_SIZE_MIN)) {
    return `${PARTY_SIZE_MIN}–${PARTY_SIZE_MAX}`;
  }
  return `${a}–${b}`;
}
