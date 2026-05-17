"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  isFlashKey,
  resolveFlashMessage,
  resolveLoadingMessageForFlash,
} from "@/lib/admin-flash";

/** Reads ?flash= / ?flash_error= / legacy ?created= and shows a centered toast. */
export function AdminFlashBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const flashKey = searchParams.get("flash");
  const flashDetail = searchParams.get("flash_detail");
  const flashError = searchParams.get("flash_error");
  const legacyCreated = searchParams.get("created");

  const resolved = useMemo(() => {
    if (flashError) {
      return { variant: "error" as const, message: flashError };
    }
    if (flashKey && isFlashKey(flashKey)) {
      return resolveFlashMessage(flashKey, flashDetail);
    }
    if (legacyCreated) {
      return resolveFlashMessage("booking_created", legacyCreated);
    }
    return null;
  }, [flashKey, flashDetail, flashError, legacyCreated]);

  const { showToast, showLoading } = useAdminToast();
  const shownRef = useRef<string | null>(null);

  const dismiss = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("flash");
    next.delete("flash_detail");
    next.delete("flash_error");
    next.delete("created");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!resolved) {
      shownRef.current = null;
      return;
    }
    const key = `${resolved.variant}:${resolved.message}`;
    if (shownRef.current === key) return;
    shownRef.current = key;
    showLoading(
      resolveLoadingMessageForFlash(
        flashKey ?? (legacyCreated ? "booking_created" : null),
        flashError,
      ),
    );
    void (async () => {
      await showToast({ message: resolved.message, variant: resolved.variant });
      dismiss();
    })();
  }, [resolved, showToast, showLoading, dismiss]);

  return null;
}
