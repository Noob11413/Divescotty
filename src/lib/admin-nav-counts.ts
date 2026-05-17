import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminNavCounts = {
  pendingBookings: number;
  newCustomRequests: number;
};

export async function fetchAdminNavCounts(
  supabase: SupabaseClient,
): Promise<AdminNavCounts> {
  const [bookingsRes, customRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("custom_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  return {
    pendingBookings: bookingsRes.count ?? 0,
    newCustomRequests: customRes.count ?? 0,
  };
}
