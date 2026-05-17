export const BOOKING_EMPLOYEE_REQUIRED_MESSAGE =
  "Assign an employee before saving this booking.";

export function bookingRequiresEmployee(employeeId: string): boolean {
  return !employeeId.trim();
}
