import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import { BookingForm } from "@/components/booking/BookingForm";
import { TaglineChip } from "@/components/site/TaglineChip";
import { getActivityBySlug, getLocations, type ActivityWithRelations } from "@/lib/queries";
import type { Location } from "@/lib/supabase/database.types";
import { formatActivityPartyRangeLabel } from "@/lib/booking-party-limits";
import { formatDuration, formatPricePHP } from "@/lib/utils";

interface RouteParams {
  category: string;
  slug: string;
}

export async function generateMetadata(
  { params }: { params: Promise<RouteParams> },
): Promise<Metadata> {
  const { category, slug } = await params;
  const activity = await getActivityBySlug(category, slug).catch(() => null);
  if (!activity) return {};
  return {
    title: activity.name,
    description: activity.short_description ?? undefined,
  };
}

export default async function ActivityDetailPage(
  { params }: { params: Promise<RouteParams> },
) {
  const { category, slug } = await params;
  const [activity, allLocations] = await Promise.all([
    getActivityBySlug(category, slug).catch(() => null),
    getLocations().catch(() => []),
  ]);
  const typedActivity = activity as ActivityWithRelations | null;
  const typedLocations = allLocations as Location[];

  if (!typedActivity) notFound();

  const offeredLocations = typedActivity.locations.length
    ? typedLocations.filter((l) =>
        typedActivity.locations.some((al) => al.slug === l.slug),
      )
    : typedLocations;

  const img = typedActivity.image_url ?? "/media/scuba.jpg";

  return (
    <>
      <section className="relative h-[80svh] min-h-[520px] w-full overflow-hidden bg-base-300">
        <Image
          src={img}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/40 to-base-100/20" />

        <div className="absolute left-5 right-5 top-24 z-10 flex items-center justify-between md:left-10 md:right-10 md:top-28">
          <Link
            href={`/${category}`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.32em] hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to {typedActivity.category?.name ?? category}
          </Link>
          {typedActivity.availability_label && (
            <TaglineChip>{typedActivity.availability_label}</TaglineChip>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-5 pb-16 md:px-10 md:pb-20">
          <p className="eyebrow">
            {typedActivity.category?.name}
            {typedActivity.subcategory?.name
              ? ` · ${typedActivity.subcategory.name}`
              : ""}
          </p>
          <h1 className="h-display mt-4 text-[clamp(3rem,9vw,9rem)]">
            {typedActivity.name}
          </h1>
          {typedActivity.short_description && (
            <p className="mt-6 max-w-2xl text-base text-base-content/80 md:text-lg">
              {typedActivity.short_description}
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-base-content/10 bg-base-100">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat
                icon={<Clock className="h-4 w-4" strokeWidth={1.5} />}
                label="Duration"
                value={formatDuration(typedActivity.duration_minutes)}
              />
              <Stat
                icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
                label="Group"
                value={`${formatActivityPartyRangeLabel(typedActivity.min_party, typedActivity.max_party)} divers`}
              />
              <Stat
                icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />}
                label="Locations"
                value={
                  typedActivity.locations.length > 0
                    ? typedActivity.locations.map((l) => l.name).join(", ")
                    : "Multiple"
                }
              />
            </div>

            <div className="mt-10">
              <p className="eyebrow">From</p>
              <p className="h-display mt-2 text-5xl md:text-6xl">
                {formatPricePHP(typedActivity.price_cents)}
                <span className="ml-3 align-middle text-base text-base-content/50">
                  per person
                </span>
              </p>
            </div>

            {typedActivity.description && (
              <div className="prose prose-invert mt-12 max-w-none text-base leading-relaxed text-base-content/80">
                {typedActivity.description.split(/\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 gap-4 border-t border-base-content/10 pt-12 sm:grid-cols-2">
              <InfoBlock
                title="What&apos;s included"
                body="Boat, fuel, professional guide, all rental gear, and refreshments. Anything specialised (cameras, sidemount kits, custom transfers) can be arranged on request."
              />
              <InfoBlock
                title="What to bring"
                body="Swimwear, sun protection, a towel and your own mask if you prefer. Certified divers should bring their cert card and logbook."
              />
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 border border-base-content/15 bg-base-200/40 p-6 md:p-8">
              <BookingForm
                activityId={typedActivity.id}
                activityName={typedActivity.name}
                pricePhpCents={typedActivity.price_cents}
                locations={offeredLocations.map((l) => ({
                  id: l.id,
                  slug: l.slug,
                  name: l.name,
                }))}
                minParty={typedActivity.min_party}
                maxParty={typedActivity.max_party}
              />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-base-content/10 p-4">
      <div className="flex items-center gap-2 text-base-content/60">
        {icon}
        <span className="text-[10px] uppercase tracking-[0.32em]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-medium">{value}</p>
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {title}
      </h4>
      <p className="mt-3 text-sm leading-relaxed text-base-content/75">
        {body}
      </p>
    </div>
  );
}
