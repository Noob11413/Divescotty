import {
  BOOKING_EMPLOYEE_REQUIRED_MESSAGE,
  bookingRequiresEmployee,
} from "@/lib/booking-guardrails";

export function bookingFormEmployeeMissing(form: HTMLFormElement): boolean {
  const employeeId = String(new FormData(form).get("employee_id") ?? "");
  return bookingRequiresEmployee(employeeId);
}

export { BOOKING_EMPLOYEE_REQUIRED_MESSAGE };
