import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPricePHP(cents: number | null | undefined): string {
  if (cents == null) return "Inquire";
  const value = cents / 100;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
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
