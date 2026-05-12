import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Admin sign-in",
};

interface SearchParams {
  redirect?: string;
}

export default async function LoginPage(
  { searchParams }: { searchParams: Promise<SearchParams> },
) {
  const { redirect } = await searchParams;

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <section className="relative hidden bg-base-300 lg:block">
        <Image
          src="/media/freedive.jpg"
          alt=""
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-base-100/80 via-base-100/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-12 pb-16">
          <p className="eyebrow">Internal</p>
          <h1 className="h-display mt-4 text-6xl">
            Admin sign-in.
          </h1>
          <p className="mt-4 max-w-md text-sm text-base-content/70">
            Manage bookings, edit activities, and review the day&apos;s
            requests.
          </p>
        </div>
      </section>

      <section className="flex items-center bg-base-100 px-6 py-16 md:px-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.32em] text-base-content/60 hover:text-primary"
          >
            ← Back to site
          </Link>

          <div className="mt-10">
            <p className="eyebrow">Sign in</p>
            <h2 className="h-display mt-3 text-4xl uppercase">
              Scotty&apos;s admin
            </h2>
          </div>

          <div className="mt-10">
            <LoginForm redirect={redirect ?? "/admin"} />
          </div>

          <p className="mt-10 text-xs text-base-content/50">
            Public sign-up is disabled. To create the first admin, see the
            README under{" "}
            <code className="bg-base-200 px-1.5 py-0.5">
              promote_to_admin
            </code>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
