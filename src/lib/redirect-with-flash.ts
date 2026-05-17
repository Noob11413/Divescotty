import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import type { FlashKey } from "@/lib/admin-flash";

/** Next.js `redirect()` throws — must not be handled as a user-facing error. */
export function rethrowIfRedirect(error: unknown): void {
  if (isRedirectError(error)) {
    throw error;
  }
}

function buildFlashUrl(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const [pathname, existingQuery] = path.split("?");
  const search = new URLSearchParams(existingQuery ?? "");
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      search.delete(key);
    } else {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function redirectWithFlash(
  path: string,
  flash: FlashKey,
  detail?: string,
): never {
  redirect(
    buildFlashUrl(path, {
      flash,
      flash_detail: detail,
      flash_error: undefined,
      created: undefined,
    }),
  );
}

export function redirectWithFlashError(path: string, message: string): never {
  redirect(
    buildFlashUrl(path, {
      flash_error: message,
      flash: undefined,
      flash_detail: undefined,
    }),
  );
}

/** Use in server-action `catch` blocks that may call `redirectWithFlash`. */
export function redirectWithFlashErrorFromCatch(
  path: string,
  error: unknown,
  fallbackMessage: string,
): never {
  rethrowIfRedirect(error);
  redirectWithFlashError(
    path,
    error instanceof Error ? error.message : fallbackMessage,
  );
}
