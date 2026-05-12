import { createBrowserClient } from "@supabase/ssr";

/** See `server.ts` — loosen client generic until types are codegen'd from Supabase. */
export function createClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see server.ts
  return createBrowserClient<any, "public", any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
