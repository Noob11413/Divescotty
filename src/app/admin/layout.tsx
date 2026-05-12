import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { LogOut } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Activities", href: "/admin/activities" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Locations", href: "/admin/locations" },
  { label: "Employees", href: "/admin/employees" },
  { label: "Custom Bookings", href: "/admin/custom-bookings" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");

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
  if (role !== "admin") redirect("/");

  return (
    <div data-theme="scotty-light" className="min-h-screen bg-base-100 text-base-content">
      <header className="border-b border-base-content/10 bg-base-200">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/media/scotty-logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div>
              <p className="font-display text-sm uppercase tracking-[0.32em]">
                Scotty&apos;s Admin
              </p>
              <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                {user.email}
              </p>
            </div>
          </Link>

          <nav className="order-3 flex w-full gap-6 overflow-x-auto text-xs uppercase tracking-[0.28em] md:order-2 md:w-auto">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap hover:text-primary"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <form action={logoutAction} className="md:order-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 border border-base-content/30 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-10 md:px-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
