import { ArrowRight } from "lucide-react";

export function NewsletterStrip() {
  return (
    <section className="border-y border-base-content/10 bg-base-200">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
        <div>
          <p className="eyebrow">Stay ahead of the tide</p>
          <h3 className="h-display mt-3 text-4xl md:text-6xl">
            Subscribe for trip drops &amp; weather windows.
          </h3>
        </div>
        <form
          className="flex flex-col items-stretch justify-center gap-3"
          action="#"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="flex border border-base-content/30">
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Your email address"
              className="flex-1 bg-transparent px-4 py-4 text-sm tracking-wide outline-none placeholder:text-base-content/40"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-primary px-5 text-xs font-semibold uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
            >
              Subscribe
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <p className="text-xs text-base-content/40">
            By signing up, you agree to receive the Scotty&apos;s newsletter. No spam.
          </p>
        </form>
      </div>
    </section>
  );
}
