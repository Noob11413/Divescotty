import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityCard } from "./ActivityCard";
import { TaglineChip } from "./TaglineChip";
import {
  type ActivityWithRelations,
  getActivitiesByCategorySlug,
  getCategoryBySlug,
  getSubcategoriesByCategoryId,
} from "@/lib/queries";

interface CategoryLandingProps {
  slug: string;
}

type LandingCategory = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  hero_image: string | null;
};

type SubcategoryRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  description: string | null;
};

function activityCardProps(
  a: ActivityWithRelations,
  categorySlug: string,
  subcategoryName?: string | null,
) {
  return {
    slug: a.slug,
    name: a.name,
    shortDescription: a.short_description,
    image: a.image_url,
    pricePhpCents: a.price_cents,
    availabilityLabel: a.availability_label,
    categorySlug,
    subcategoryName: subcategoryName ?? a.subcategory?.name ?? null,
    locations: a.locations,
  };
}

export async function CategoryLanding({ slug }: CategoryLandingProps) {
  const categoryRaw = await getCategoryBySlug(slug).catch(() => null);
  const category = categoryRaw as LandingCategory | null;
  if (!category) notFound();

  const [activitiesRaw, subcategoriesRaw] = await Promise.all([
    getActivitiesByCategorySlug(slug).catch(() => []),
    getSubcategoriesByCategoryId(category.id).catch(() => []),
  ]);
  const activities = activitiesRaw as ActivityWithRelations[];
  const subcategories = subcategoriesRaw as SubcategoryRow[];

  const subSlugSet = new Set(subcategories.map((s) => s.slug));
  const unassigned = activities.filter(
    (a) => !a.subcategory || !subSlugSet.has(a.subcategory.slug),
  );
  const hasSubs = subcategories.length > 0;
  const showOtherChip = unassigned.length > 0;

  return (
    <>
      <section className="relative h-[80svh] min-h-[520px] w-full overflow-hidden bg-base-300">
        {category.hero_image && (
          <Image
            src={category.hero_image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-base-100/30" />

        <div className="absolute left-5 right-5 top-24 z-10 flex items-center justify-between md:left-10 md:right-10 md:top-28">
          <TaglineChip>Scotty&apos;s · {category.name}</TaglineChip>
          {category.tagline && (
            <TaglineChip className="hidden md:inline-flex">
              {category.tagline}
            </TaglineChip>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-5 pb-16 md:px-10 md:pb-20">
          <p className="eyebrow">Activities</p>
          <h1 className="h-display mt-4 text-[clamp(3.5rem,11vw,11rem)]">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-6 max-w-2xl text-base text-base-content/80 md:text-lg">
              {category.description}
            </p>
          )}
        </div>
      </section>

      <section
        id="category-activities"
        className="scroll-mt-28 border-t border-base-content/10 bg-base-100"
      >
        <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
          {activities.length === 0 && subcategories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="eyebrow">Soon</p>
              <p className="h-display text-4xl">Activities loading.</p>
              <p className="max-w-md text-sm text-base-content/60">
                Run{" "}
                <code className="bg-base-200 px-1.5 py-0.5 text-xs">
                  supabase db reset
                </code>{" "}
                to load the seeded sample activities.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <p className="eyebrow">
                  {activities.length} trip{activities.length === 1 ? "" : "s"}
                  {subcategories.length > 0 && (
                    <span className="text-base-content/50">
                      {" "}
                      · {subcategories.length} type
                      {subcategories.length === 1 ? "" : "s"}
                    </span>
                  )}
                </p>
                <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/50">
                  {hasSubs ? "Grouped by experience type" : "Catalog order"}
                </p>
              </div>

              {hasSubs && (
                <nav
                  className="mt-8 flex flex-wrap gap-2"
                  aria-label="Jump to experience type"
                >
                  <Link
                    href="#category-activities"
                    className="border border-base-content/25 bg-base-200/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] hover:border-primary hover:text-primary"
                  >
                    Top
                  </Link>
                  {subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`#cat-sub-${sub.slug}`}
                      className="border border-base-content/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] hover:border-primary hover:text-primary"
                    >
                      {sub.name}
                    </Link>
                  ))}
                  {showOtherChip && (
                    <Link
                      href="#cat-sub-more"
                      className="border border-base-content/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] hover:border-primary hover:text-primary"
                    >
                      Other trips
                    </Link>
                  )}
                </nav>
              )}

              {!hasSubs ? (
                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={activityCardProps(a, category.slug)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-14 flex flex-col gap-16">
                  {subcategories.map((sub) => {
                    const inSection = activities.filter(
                      (a) => a.subcategory?.slug === sub.slug,
                    );
                    return (
                      <div
                        key={sub.id}
                        id={`cat-sub-${sub.slug}`}
                        className="scroll-mt-28"
                      >
                        <div className="max-w-3xl border-b border-base-content/15 pb-4">
                          <h2 className="font-display text-3xl uppercase tracking-wide md:text-4xl">
                            {sub.name}
                          </h2>
                          {sub.description && (
                            <p className="mt-2 text-sm text-base-content/70">
                              {sub.description}
                            </p>
                          )}
                        </div>
                        {inSection.length === 0 ? (
                          <p className="mt-6 text-sm text-base-content/60">
                            No published trips in this section yet. Explore other
                            types above or{" "}
                            <Link href="/contact" className="underline hover:text-primary">
                              contact us
                            </Link>{" "}
                            for a custom plan.
                          </p>
                        ) : (
                          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {inSection.map((a) => (
                              <ActivityCard
                                key={a.id}
                                activity={activityCardProps(a, category.slug, sub.name)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {showOtherChip && (
                    <div id="cat-sub-more" className="scroll-mt-28">
                      <div className="max-w-3xl border-b border-base-content/15 pb-4">
                        <h2 className="font-display text-3xl uppercase tracking-wide md:text-4xl">
                          More experiences
                        </h2>
                        <p className="mt-2 text-sm text-base-content/70">
                          Trips not assigned to a specific type yet.
                        </p>
                      </div>
                      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {unassigned.map((a) => (
                          <ActivityCard
                            key={a.id}
                            activity={activityCardProps(a, category.slug)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
