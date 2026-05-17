import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { FlashVariantIcon } from "@/components/ui/FlashVariantIcon";
import type { FlashVariant } from "@/lib/admin-flash";

/** Full class names so Tailwind/DaisyUI include variant styles (dynamic `alert-${x}` is purged). */
const VARIANT_CLASSES: Record<FlashVariant, string> = {
  success: "alert alert-success alert-soft",
  warning: "alert alert-warning alert-soft",
  error: "alert alert-error alert-soft",
  info: "alert alert-info alert-soft",
};

export function AdminAlert({
  variant,
  message,
  href,
  actionLabel = "View bookings",
  onDismiss,
  className = "",
}: {
  variant: FlashVariant;
  message: string;
  href?: string;
  actionLabel?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  const baseClass = `${VARIANT_CLASSES[variant]} alert-vertical sm:alert-horizontal ${className}`.trim();

  const body = (
    <>
      <FlashVariantIcon variant={variant} />
      <span className="flex-1 text-sm">{message}</span>
      {href ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em]">
          {actionLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="btn btn-ghost btn-sm"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        role="alert"
        className={`${baseClass} transition-opacity hover:opacity-90`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div role="alert" className={baseClass}>
      {body}
    </div>
  );
}
