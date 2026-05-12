import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Location } from "@/lib/supabase/database.types";

interface LocationGridProps {
  locations: Pick<Location, "slug" | "name" | "region" | "hero_image" | "description">[];
}

export function LocationGrid({ locations }: LocationGridProps) {
  return (
    <section className="border-t border-base-content/10 bg-base-100">
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Where we operate</p>
            <h2 className="h-display mt-3 text-5xl md:text-7xl">
              Three islands.
              <br />
              One archipelago.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-base-content/65">
            Scotty&apos;s has dive shops and watersports rigs across three of the
            Philippines&apos; most iconic islands. Pick a base, pick a season, and
            we&apos;ll handle the rest.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {locations.map((loc) => (
            <Link
              key={loc.slug}
              href={`/locations/${loc.slug}`}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden border border-base-content/10 p-6 md:p-8"
            >
              {loc.hero_image && (
                <Image
                  src={loc.hero_image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/30 to-transparent" />
              <div className="relative flex w-full items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                    {loc.region}
                  </p>
                  <h3 className="h-display mt-2 text-3xl md:text-4xl">
                    {loc.name}
                  </h3>
                </div>
                <ArrowUpRight
                  className="h-6 w-6 transition group-hover:translate-x-1 group-hover:-translate-y-1"
                  strokeWidth={1.25}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
