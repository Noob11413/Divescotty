import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see server.ts
  const supabase = createServerClient<any, "public", any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the session on every request — do NOT
  // remove it. Per Supabase guidance, getSession() in server code can return
  // a stale session because it does not contact the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginRoute = path.startsWith("/login");

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }

    // Authorization claim must come from app_metadata (server-set, immutable
    // by the user) — never from user_metadata.
    const appRole =
      (user.app_metadata as { role?: string } | null)?.role ?? "customer";
    let role = appRole;

    if (role !== "admin") {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const profile = data as { role?: string } | null;
      role = profile?.role ?? role;
    }

    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (isLoginRoute && user) {
    const appRole =
      (user.app_metadata as { role?: string } | null)?.role ?? "customer";
    let role = appRole;
    if (role !== "admin") {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const profile = data as { role?: string } | null;
      role = profile?.role ?? role;
    }
    if (role !== "admin") {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}
