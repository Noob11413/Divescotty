/**
 * Supabase public credentials for browser + server clients.
 * Dashboard may label the key "anon" (JWT) or "publishable" (sb_publishable_…).
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local — use your project URL from Supabase → Settings → API.",
    );
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing API key: set NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local from Supabase → Settings → API.",
    );
  }
  return key;
}

export function getSupabasePublicConfig() {
  return { url: getSupabaseUrl(), anonKey: getSupabaseAnonKey() };
}
