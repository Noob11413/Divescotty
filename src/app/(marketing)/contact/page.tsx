import {
  Award,
  CalendarRange,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
} from "lucide-react";
import { getLocations } from "@/lib/queries";
import { CustomBookingRequestForm } from "@/components/booking/CustomBookingRequestForm";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with Scotty's Action Sports Network for bookings, custom trips, or general questions.",
};

const CONTACT_BLOCKS = [
  {
    icon: Phone,
    title: "Phone",
    body: "+63 917 631 2960",
    href: "tel:+639176312960",
    cta: "Call now",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    body: "Fastest response, any time zone.",
    href: "https://wa.me/639176312960",
    cta: "Open chat",
  },
  {
    icon: Mail,
    title: "Email",
    body: "bookings@divescotty.com",
    href: "mailto:bookings@divescotty.com",
    cta: "Compose",
  },
  {
    icon: MapPin,
    title: "Headquarters",
    body: "Punta Engaño, Mactan Island, Lapu-Lapu City, Cebu",
    href: "https://maps.google.com/?q=Punta+Enga%C3%B1o+Road+Mactan",
    cta: "View map",
  },
];

export default async function ContactPage() {
  const locations = (await getLocations().catch(() => [])) as Array<{
    id: string;
    name: string;
  }>;
  return (
    <>
      <section className="bg-base-100 pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <p className="eyebrow">Get in touch</p>
          <h1 className="h-display mt-3 text-[clamp(3rem,9vw,9rem)]">
            Plan a trip.
            <br />
            Ask anything.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-base-content/75 md:text-lg">
            For activity-specific questions, head straight to the activity
            page and use the booking form — that&apos;s the fastest path. For
            custom trips, partnerships, or anything else, here&apos;s every way
            to reach the team.
          </p>
        </div>
      </section>

      <section className="bg-base-100 pb-24">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-px bg-base-content/10 px-5 md:grid-cols-2 md:px-10 lg:grid-cols-4">
          {CONTACT_BLOCKS.map((b) => {
            const Icon = b.icon;
            return (
              <a
                key={b.title}
                href={b.href}
                target={b.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex flex-col gap-6 bg-base-100 p-8 transition hover:bg-base-200"
              >
                <Icon className="h-6 w-6" strokeWidth={1.25} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                    {b.title}
                  </p>
                  <p className="mt-2 text-base">{b.body}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-primary">
                  {b.cta} →
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="border-t border-base-content/10 bg-base-200/40 py-20">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 px-5 md:grid-cols-12 md:px-10">
          <div className="md:col-span-4 flex flex-col gap-6">
            <div>
              <p className="eyebrow">Custom booking</p>
              <h2 className="font-display mt-3 text-5xl uppercase leading-[0.95]">
                Build your
                <br />
                own trip
              </h2>
              <p className="mt-4 text-sm text-base-content/70">
                If your plan does not match a standard activity, send us your
                exact request and the team will quote and tailor it for you.
              </p>
            </div>

            <div className="border border-base-content/10 bg-base-100 p-5">
              <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-primary">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Every quote includes
              </p>
              <ul className="mt-4 space-y-3 text-sm text-base-content/80">
                <Inclusion icon={CalendarRange}>
                  Tailored itinerary built around your dates
                </Inclusion>
                <Inclusion icon={Award}>
                  Certified instructors and licensed guides
                </Inclusion>
                <Inclusion icon={MapPin}>
                  Dive sites, transfers, and pickups arranged for you
                </Inclusion>
                <Inclusion icon={CheckCircle2}>
                  Transparent pricing — no charge until you approve
                </Inclusion>
              </ul>
            </div>

            <div className="border border-base-content/10 bg-base-100 p-5">
              <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Response time
              </p>
              <p className="mt-3 font-display text-3xl uppercase">
                Usually within hours
              </p>
              <p className="mt-1 text-xs text-base-content/60">
                Live team on PH time (UTC+8). Replies even faster on WhatsApp.
              </p>
            </div>
          </div>

          <div className="md:col-span-8 border border-base-content/10 bg-base-100 p-6 md:p-8">
            <CustomBookingRequestForm
              locations={locations.map((location) => ({
                id: location.id,
                name: location.name,
              }))}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Inclusion({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
