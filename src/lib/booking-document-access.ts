import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type BookingDocumentClient = Awaited<ReturnType<typeof createClient>>;

/** Service role, or the signed-in admin's session (RLS allows booking reads). */
export async function getClientForBookingDocuments(): Promise<{
  client: BookingDocumentClient;
  isAdmin: boolean;
} | null> {
  const service = createServiceRoleClient();
  if (service) {
    return { client: service as unknown as BookingDocumentClient, isAdmin: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let isAdmin =
    (user.app_metadata as { role?: string } | null)?.role === "admin";
  if (!isAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const profile = data as { role?: string } | null;
    isAdmin = profile?.role === "admin";
  }

  if (!isAdmin) return null;
  return { client: supabase, isAdmin: true };
}
