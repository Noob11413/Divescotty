import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { FlashVariant } from "@/lib/admin-flash";

export const FLASH_VARIANT_ICONS: Record<FlashVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

export function FlashVariantIcon({
  variant,
  className = "h-6 w-6 shrink-0 stroke-current",
}: {
  variant: FlashVariant;
  className?: string;
}) {
  const Icon = FLASH_VARIANT_ICONS[variant];
  return <Icon className={className} aria-hidden />;
}
