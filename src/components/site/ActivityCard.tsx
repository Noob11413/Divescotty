import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPricePHP } from "@/lib/utils";

export interface ActivityCardData {
  slug: string;
  name: string;
  shortDescription: string | null;
  image: string | null;
  pricePhpCents: number | null;
  availabilityLabel: string | null;
  categorySlug: string;
  /** Shown under the title when set (e.g. category landing grouped by subcategory). */
  subcategoryName?: string | null;
  locations: { slug: string; name: string }[];
}

interface ActivityCardProps {
  activity: ActivityCardData;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const detailHref = `/activities/${activity.categorySlug}/${activity.slug}`;
  const bookHref = `${detailHref}#book`;
  const img = activity.image ?? "/media/scuba.jpg";

  return (
    <article className="group flex flex-col border border-base-content/10 bg-base-200/50 transition hover:border-base-content/30">
      <Link href={detailHref} className="relative block aspect-[4/5] w-full overflow-hidden">
        <Image
          src={img}
          alt={activity.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between text-[10px] uppercase tracking-[0.28em]">
          {activity.availabilityLabel && (
            <span className="bg-base-100/80 px-2 py-1 backdrop-blur-md">
              {activity.availabilityLabel}
            </span>
          )}
          {activity.pricePhpCents != null && (
            <span className="ml-auto bg-primary px-2 py-1 text-primary-content">
              From {formatPricePHP(activity.pricePhpCents)}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          {activity.subcategoryName && (
            <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/50">
              {activity.subcategoryName}
            </p>
          )}
          <h3
            className={`font-display text-2xl uppercase tracking-wide${activity.subcategoryName ? " mt-1" : ""}`}
          >
            {activity.name}
          </h3>
          {activity.shortDescription && (
            <p className="mt-2 line-clamp-2 text-sm text-base-content/65">
              {activity.shortDescription}
            </p>
          )}
        </div>

        {activity.locations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activity.locations.map((l) => (
              <span
                key={l.slug}
                className="border border-base-content/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] text-base-content/60"
              >
                {l.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-stretch gap-2">
          <Link
            href={bookHref}
            className="flex-1 bg-primary px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
          >
            Book now
          </Link>
          <Link
            href={detailHref}
            className="inline-flex items-center justify-center gap-2 border border-base-content/30 px-4 py-3 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
          >
            Details
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </article>
  );
}
