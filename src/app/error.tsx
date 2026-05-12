"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-base-100 px-5">
      <div className="max-w-xl text-center">
        <p className="eyebrow">Something broke</p>
        <h1 className="h-display mt-4 text-6xl">A reef of errors.</h1>
        <p className="mt-6 text-sm text-base-content/65">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-block bg-primary px-6 py-4 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
