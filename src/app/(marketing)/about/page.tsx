import Image from "next/image";
import { TaglineChip } from "@/components/site/TaglineChip";

export const metadata = {
  title: "About",
  description:
    "Scotty's Action Sports Network has been operating in the Philippines since 1986. PADI certified since 1993, GUE training, and the most comprehensive watersports lineup in the Visayas.",
};

export default function AboutPage() {
  return (
    <>
      <section className="relative h-[60svh] min-h-[420px] w-full overflow-hidden bg-base-300">
        <Image
          src="/media/scuba.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-base-100/30" />

        <div className="absolute left-5 right-5 top-24 z-10 flex items-center justify-between md:left-10 md:right-10 md:top-28">
          <TaglineChip>Operating since 1986</TaglineChip>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-5 pb-16 md:px-10 md:pb-20">
          <p className="eyebrow">About</p>
          <h1 className="h-display mt-4 text-[clamp(3.5rem,9vw,9rem)]">
            Forty years
            <br />
            in the water.
          </h1>
        </div>
      </section>

      <section className="border-t border-base-content/10 bg-base-100">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Who we are</p>
            <h2 className="h-display mt-3 text-4xl md:text-5xl">
              From a single dive shop to an archipelago.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-relaxed text-base-content/75 lg:col-span-7">
            <p>
              Scotty&apos;s Action Sports Network started life as a dive shop on
              Mactan Island in 1986. Forty years later we operate across three
              of the Philippines&apos; most iconic destinations — Mactan, Panglao
              and Boracay — running everything from intro scuba dives to
              technical CCR, freediving courses, every speedboat-towed
              watersport you can name, and tailored island hops.
            </p>
            <p>
              We have been a PADI certified dive center since 1993, run GUE
              training, and have one of the largest fleets of watersports
              equipment in the Visayas. Most importantly, we have the same
              local crews running our boats today that we did a decade ago —
              and they know these reefs and channels better than anyone.
            </p>
            <p>
              If it&apos;s under water, on water, or above water, we do it.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-base-content/10 bg-base-200">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px bg-base-content/10 md:grid-cols-4">
          {[
            { num: "40", label: "Years operating" },
            { num: "3", label: "Island bases" },
            { num: "30+", label: "Activity types" },
            { num: "10K+", label: "Divers certified" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-base-100 px-6 py-12 md:px-10 md:py-16"
            >
              <p className="h-display text-5xl text-primary md:text-7xl">
                {s.num}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
