"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Plus, RefreshCw, Save, type LucideIcon } from "lucide-react";
import { FlashVariantIcon } from "@/components/ui/FlashVariantIcon";
import {
  DEFAULT_FORM_LOADING_MESSAGE,
  type FlashVariant,
} from "@/lib/admin-flash";

type ToastItem = {
  id: string;
  message: string;
  variant: FlashVariant;
};

const TOAST_DURATION_MS = 1500;
const MIN_LOADING_MS = 400;

/** DaisyUI toast + alert — https://daisyui.com/components/toast/ */
const VARIANT_CLASSES: Record<FlashVariant, string> = {
  success: "alert alert-success alert-soft",
  warning: "alert alert-warning alert-soft",
  error: "alert alert-error alert-soft",
  info: "alert alert-info alert-soft",
};

type AdminToastContextValue = {
  showToast: (options: { message: string; variant?: FlashVariant }) => void | Promise<void>;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function useAdminToast(): AdminToastContextValue {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function readFormLoadingMessage(form: HTMLFormElement): string {
  const fromForm = form.dataset.loadingMessage?.trim();
  if (fromForm) return fromForm;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const fromButton = submit?.dataset.loadingMessage?.trim();
  if (fromButton) return fromButton;
  return DEFAULT_FORM_LOADING_MESSAGE;
}

function loadingContextIcon(message: string): LucideIcon {
  const lower = message.toLowerCase();
  if (lower.includes("updat") || lower.includes("convert")) return RefreshCw;
  if (lower.includes("creat")) return Plus;
  return Save;
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const baseId = useId();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_FORM_LOADING_MESSAGE);
  const loadingStartedAt = useRef<number | null>(null);

  const showLoading = useCallback((message = DEFAULT_FORM_LOADING_MESSAGE) => {
    loadingStartedAt.current = Date.now();
    setLoadingMessage(message);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    loadingStartedAt.current = null;
    setLoading(false);
  }, []);

  const showToast = useCallback(
    async ({ message, variant = "error" }: { message: string; variant?: FlashVariant }) => {
      if (loadingStartedAt.current != null) {
        const elapsed = Date.now() - loadingStartedAt.current;
        if (elapsed < MIN_LOADING_MS) {
          await delay(MIN_LOADING_MS - elapsed);
        }
      }
      setLoading(false);
      loadingStartedAt.current = null;

      const id = `${baseId}-${Date.now()}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
    },
    [baseId],
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, TOAST_DURATION_MS),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [toasts]);

  useEffect(() => {
    const onSubmit = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLFormElement)) return;
      if (target.dataset.skipSubmitLoading === "true") return;
      showLoading(readFormLoadingMessage(target));
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [showLoading]);

  useEffect(() => {
    if (!loading) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [loading]);

  const LoadingIcon = loading ? loadingContextIcon(loadingMessage) : Save;

  return (
    <AdminToastContext.Provider value={{ showToast, showLoading, hideLoading }}>
      {children}
      {loading ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-base-content/55 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={loadingMessage}
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-base-100/10 px-10 py-8 ring-1 ring-base-100/20 backdrop-blur-md">
            <LoadingIcon
              className="h-9 w-9 text-primary drop-shadow-sm"
              strokeWidth={1.75}
              aria-hidden
            />
            <span
              className="loading loading-bars loading-lg text-primary"
              aria-hidden
            />
            <p className="max-w-xs text-center text-sm font-medium tracking-wide text-base-100">
              {loadingMessage}
            </p>
          </div>
        </div>
      ) : null}
      <div
        aria-live="polite"
        className="toast toast-center toast-middle z-[310] w-full max-w-md pointer-events-none px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${VARIANT_CLASSES[toast.variant]} alert-horizontal w-full max-w-sm pointer-events-auto shadow-lg`}
          >
            <FlashVariantIcon variant={toast.variant} />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}
