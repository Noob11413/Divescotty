import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Typed as `any` until `npm run supabase:types` overwrites `database.types.ts`.
 * postgrest-js 2.104+ treats hand-maintained `Database` as incompatible with its
 * `GenericSchema` constraints, which collapses query results to `never`.
 */
export async function createClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module comment above
  return createServerClient<any, "public", any>(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if the middleware is refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
