import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONEY_LOCALE = "en-PH";
const MONEY_FRACTION_DIGITS = 2;

const moneyAmountFormatter = new Intl.NumberFormat(MONEY_LOCALE, {
  minimumFractionDigits: MONEY_FRACTION_DIGITS,
  maximumFractionDigits: MONEY_FRACTION_DIGITS,
});

const phpCurrencyFormatter = new Intl.NumberFormat(MONEY_LOCALE, {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: MONEY_FRACTION_DIGITS,
  maximumFractionDigits: MONEY_FRACTION_DIGITS,
});

/** Plain amount with thousands separators and 2 decimals (no currency symbol). */
export function formatMoneyAmount(amountPhp: number): string {
  return moneyAmountFormatter.format(amountPhp);
}

/** PHP display from centavos, e.g. ₱1,234.56 */
export function formatPricePHP(cents: number | null | undefined): string {
  if (cents == null) return "Inquire";
  return phpCurrencyFormatter.format(cents / 100);
}

/** Currency-prefixed display from centavos, e.g. PHP 1,234.56 */
export function formatMoneyCents(cents: number, currency = "PHP"): string {
  return `${currency} ${moneyAmountFormatter.format(Math.max(0, cents) / 100)}`;
}

/** Parse user/form input that may include commas, e.g. "10,000.50" → 10000.5 */
export function parseMoneyAmount(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Convert a PHP amount field value to integer centavos. */
export function phpAmountToCents(raw: string): number {
  if (raw.trim() === "") return 0;
  return Math.round(Math.max(0, parseMoneyAmount(raw)) * 100);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "Flexible";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h}h ${m}m`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
