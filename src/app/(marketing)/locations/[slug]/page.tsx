import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ActivityCard } from "@/components/site/ActivityCard";
import { TaglineChip } from "@/components/site/TaglineChip";
import { ArrowLeft } from "lucide-react";
import {
  type ActivityWithRelations,
  getActivitiesAtLocation,
  getLocationBySlug,
  getLocations,
} from "@/lib/queries";
import type { Location } from "@/lib/supabase/database.types";

interface RouteParams {
  slug: string;
}

export async function generateStaticParams() {
  const locations = (await getLocations().catch(() => [])) as Location[];
  return locations.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<RouteParams> },
): Promise<Metadata> {
  const { slug } = await params;
  const loc = await getLocationBySlug(slug).catch(() => null);
  if (!loc) return {};
  return {
    title: loc.name,
    description: loc.description ?? undefined,
  };
}

export default async function LocationPage(
  { params }: { params: Promise<RouteParams> },
) {
  const { slug } = await params;
  const [location, activities] = await Promise.all([
    getLocationBySlug(slug).catch(() => null),
    getActivitiesAtLocation(slug).catch(() => []),
  ]);
  const typedLocation = location as Location | null;
  const typedActivities = activities as ActivityWithRelations[];

  if (!typedLocation) notFound();

  return (
    <>
      <section className="relative h-[80svh] min-h-[520px] w-full overflow-hidden bg-base-300">
        {typedLocation.hero_image && (
          <Image
            src={typedLocation.hero_image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/40 to-base-100/20" />

        <div className="absolute left-5 right-5 top-24 z-10 flex items-center justify-between md:left-10 md:right-10 md:top-28">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.32em] hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            All locations
          </Link>
          <TaglineChip>{typedLocation.region ?? "Visayas"}</TaglineChip>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-5 pb-16 md:px-10 md:pb-20">
          <p className="eyebrow">Location</p>
          <h1 className="h-display mt-4 text-[clamp(3.5rem,11vw,11rem)]">
            {typedLocation.name}
          </h1>
          {typedLocation.description && (
            <p className="mt-6 max-w-2xl text-base text-base-content/80 md:text-lg">
              {typedLocation.description}
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-base-content/10 bg-base-100">
        <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Activities at this base</p>
              <h2 className="h-display mt-2 text-4xl md:text-5xl">
                {typedActivities.length} options
              </h2>
            </div>
            <Link
              href="/contact"
              className="text-xs uppercase tracking-[0.32em] hover:text-primary"
            >
              Plan something custom →
            </Link>
          </div>

          {typedActivities.length === 0 ? (
            <p className="mt-12 max-w-md text-sm text-base-content/60">
              We don&apos;t have any published activities for this location yet.
              Contact us and we&apos;ll put something together.
            </p>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {typedActivities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={{
                    slug: a.slug,
                    name: a.name,
                    shortDescription: a.short_description,
                    image: a.image_url,
                    pricePhpCents: a.price_cents,
                    availabilityLabel: a.availability_label,
                    categorySlug: a.category?.slug ?? "scuba",
                    subcategoryName: a.subcategory?.name ?? null,
                    locations: a.locations,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
