import Link from "next/link";
import { ActivityCard } from "@/components/site/ActivityCard";
import { LocationGrid } from "@/components/site/LocationGrid";
import { MarqueeStripe } from "@/components/site/MarqueeStripe";
import { SpotlightSection } from "@/components/site/SpotlightSection";
import { VideoHero } from "@/components/site/VideoHero";
import {
  getActivitiesByCategorySlug,
  getCategories,
  getFeaturedActivities,
  getLocations,
} from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  // Fetch in parallel. If the DB isn't connected yet (e.g. before
  // `supabase start`), fall back to empty so the page still renders.
  const [categories, featured, locations, scubaActivities] = await Promise.all([
    getCategories().catch(() => []),
    getFeaturedActivities().catch(() => []),
    getLocations().catch(() => []),
    getActivitiesByCategorySlug("scuba").catch(() => []),
  ]);

  const total = categories.length || 4;
  const primaryBookingHref =
    (featured[0] &&
      `/activities/${featured[0].category?.slug ?? "scuba"}/${featured[0].slug}#book`) ||
    (scubaActivities[0] &&
      `/activities/scuba/${scubaActivities[0].slug}#book`) ||
    "/scuba";

  return (
    <>
      <VideoHero
        videoSrc="/media/hero.mp4"
        posterSrc="/media/scuba.jpg"
        eyebrow="Scotty's Action Sports Network"
        title="Dive deeper. Live louder."
        subtitle="Scuba, freediving, watersports and island tours across Cebu, Bohol and Boracay. Operating in the Philippines since 1986."
        primaryCta={{ label: "Book an activity", href: primaryBookingHref }}
        secondaryCta={{ label: "Explore locations", href: "/locations/mactan" }}
      />

      <MarqueeStripe />

      {categories.map((cat, i) => (
        <SpotlightSection
          key={cat.id}
          index={i + 1}
          total={total}
          eyebrow={cat.tagline ?? ""}
          title={cat.name}
          description={cat.description ?? ""}
          image={cat.hero_image ?? "/media/scuba.jpg"}
          ctaHref={`/${cat.slug}`}
          ctaLabel={`Explore ${cat.name.toLowerCase()}`}
          reverse={i % 2 === 1}
          chip={cat.tagline ?? undefined}
        />
      ))}

      {featured.length > 0 && (
        <section className="border-t border-base-content/10 bg-base-100">
          <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Featured trips</p>
                <h2 className="h-display mt-3 text-5xl md:text-7xl">
                  Bestsellers,
                  <br />
                  curated by season.
                </h2>
              </div>
              <Link
                href="/scuba"
                className="text-xs uppercase tracking-[0.32em] hover:text-primary"
              >
                See all activities →
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((a) => (
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
          </div>
        </section>
      )}

      {locations.length > 0 && <LocationGrid locations={locations} />}

      <section className="border-t border-base-content/10 bg-base-200">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 px-5 py-24 md:grid-cols-2 md:px-10 md:py-32">
          <div>
            <p className="eyebrow">Mountain. Reef. Either way.</p>
            <h2 className="h-display mt-3 text-5xl md:text-7xl">
              The ocean is what you make it.
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-6 text-base-content/70">
            <p className="max-w-md text-base leading-relaxed">
              Forty years of trips, ten thousand divers, and one obsession:
              putting people in the water with operators they can trust.
            </p>
            <Link
              href="/contact"
              className="self-start border border-base-content/40 px-6 py-4 text-xs uppercase tracking-[0.32em] hover:bg-base-content hover:text-base-100"
            >
              Plan a custom trip
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
