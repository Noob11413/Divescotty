import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/** See `server.ts` — loosen client generic until types are codegen'd from Supabase. */
export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see server.ts
  return createBrowserClient<any, "public", any>(url, anonKey);
}
