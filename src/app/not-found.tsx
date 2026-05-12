import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-base-100 px-5">
      <div className="max-w-xl text-center">
        <p className="eyebrow">404 / lost at sea</p>
        <h1 className="h-display mt-4 text-7xl">Out of depth.</h1>
        <p className="mt-6 text-base text-base-content/65">
          The page you&apos;re looking for has drifted off. Try the menu, or
          surface back to safety.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-primary px-6 py-4 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
