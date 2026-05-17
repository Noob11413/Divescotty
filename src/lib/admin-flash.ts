export type FlashVariant = "success" | "warning" | "error" | "info";

export const FLASH_KEYS = [
  "employee_created",
  "employee_updated",
  "employee_deactivated",
  "employee_restored",
  "employee_deleted",
  "category_created",
  "category_updated",
  "category_deactivated",
  "category_restored",
  "category_deleted",
  "subcategory_created",
  "subcategory_updated",
  "subcategory_deactivated",
  "subcategory_restored",
  "subcategory_deleted",
  "activity_deleted",
  "location_saved",
  "settings_saved",
  "cost_template_saved",
  "booking_created",
  "booking_updated",
  "custom_request_updated",
  "custom_request_converted",
  "custom_request_submitted",
  "booking_submitted",
] as const;

export type FlashKey = (typeof FLASH_KEYS)[number];

export type FlashConfig = {
  variant: FlashVariant;
  message: string | ((detail: string | null) => string);
};

export const FLASH_MESSAGES: Record<FlashKey, FlashConfig> = {
  employee_created: {
    variant: "success",
    message: "Employee created.",
  },
  employee_updated: {
    variant: "success",
    message: "Employee updated.",
  },
  employee_deactivated: {
    variant: "warning",
    message: "Employee deactivated.",
  },
  employee_restored: {
    variant: "success",
    message: "Employee restored and marked active.",
  },
  employee_deleted: {
    variant: "success",
    message: "Employee permanently deleted.",
  },
  category_created: {
    variant: "success",
    message: "Category created.",
  },
  category_updated: {
    variant: "success",
    message: "Category updated.",
  },
  category_deactivated: {
    variant: "warning",
    message: "Category deactivated.",
  },
  category_restored: {
    variant: "success",
    message: "Category restored.",
  },
  category_deleted: {
    variant: "success",
    message: "Category permanently deleted.",
  },
  subcategory_created: {
    variant: "success",
    message: "Subcategory created.",
  },
  subcategory_updated: {
    variant: "success",
    message: "Subcategory updated.",
  },
  subcategory_deactivated: {
    variant: "warning",
    message: "Subcategory deactivated.",
  },
  subcategory_restored: {
    variant: "success",
    message: "Subcategory restored.",
  },
  subcategory_deleted: {
    variant: "success",
    message: "Subcategory permanently deleted.",
  },
  activity_deleted: {
    variant: "success",
    message: "Activity deleted.",
  },
  location_saved: {
    variant: "success",
    message: "Location saved.",
  },
  settings_saved: {
    variant: "success",
    message: "Settings saved.",
  },
  cost_template_saved: {
    variant: "success",
    message: "Cost template saved.",
  },
  booking_created: {
    variant: "success",
    message: (detail) =>
      detail
        ? `Booking ${detail} created. Customer email sent if SMTP is configured.`
        : "Booking created. Customer email sent if SMTP is configured.",
  },
  booking_updated: {
    variant: "success",
    message: "Booking updated.",
  },
  custom_request_updated: {
    variant: "success",
    message: "Custom booking request updated.",
  },
  custom_request_converted: {
    variant: "success",
    message: "Custom request converted to a booking.",
  },
  custom_request_submitted: {
    variant: "success",
    message: "Your custom booking request was submitted. We will contact you soon.",
  },
  booking_submitted: {
    variant: "success",
    message: "Your booking request was submitted. Check your email for confirmation.",
  },
};

export function isFlashKey(value: string): value is FlashKey {
  return (FLASH_KEYS as readonly string[]).includes(value);
}

export function resolveFlashMessage(
  key: FlashKey,
  detail: string | null,
): { variant: FlashVariant; message: string } {
  const config = FLASH_MESSAGES[key];
  const message =
    typeof config.message === "function"
      ? config.message(detail)
      : config.message;
  return { variant: config.variant, message };
}

export const DEFAULT_FORM_LOADING_MESSAGE = "Saving changes…";

export const DEFAULT_REDIRECT_LOADING_MESSAGE = "Updating changes…";

/** Shown on the blocking overlay after redirect (before the toast). */
export function resolveLoadingMessageForFlash(
  flashKey: string | null,
  flashError: string | null,
): string {
  if (flashError) return DEFAULT_REDIRECT_LOADING_MESSAGE;
  if (flashKey && isFlashKey(flashKey)) {
    if (flashKey.startsWith("booking_")) return "Updating booking…";
    if (flashKey.startsWith("employee_")) return "Updating employee…";
    if (flashKey.startsWith("category_") || flashKey.startsWith("subcategory_")) {
      return "Updating category…";
    }
    if (flashKey === "activity_deleted") return "Updating activity…";
    if (flashKey === "location_saved") return "Updating location…";
    if (flashKey === "settings_saved") return "Updating settings…";
    if (flashKey === "cost_template_saved") return "Updating cost template…";
    if (flashKey.startsWith("custom_request_")) return "Updating request…";
  }
  return DEFAULT_REDIRECT_LOADING_MESSAGE;
}
