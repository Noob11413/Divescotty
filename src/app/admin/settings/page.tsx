import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Clock,
  Film,
  Globe2,
  Heading2,
  Image as ImageIcon,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  MousePointerClick,
  Save,
  Sparkles,
  Tag,
  Type as TypeIcon,
  type LucideIcon,
} from "lucide-react";
import { upsertSiteSettings } from "@/app/actions/settings";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIMEZONE_OPTIONS = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Bangkok",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

type SiteSettings = {
  id: string;
  business_name: string;
  contact_email: string;
  whatsapp_number: string;
  timezone: string;
  hero_eyebrow?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_video_url?: string | null;
  hero_poster_url?: string | null;
  hero_primary_cta_label?: string | null;
  hero_primary_cta_href?: string | null;
  hero_secondary_cta_label?: string | null;
  hero_secondary_cta_href?: string | null;
  updated_at?: string | null;
};

const HERO_DEFAULTS = {
  eyebrow: "Scotty's Action Sports Network",
  title: "Dive deeper. Live louder.",
  subtitle:
    "Scuba, freediving, watersports and island tours across Cebu, Bohol and Boracay. Operating in the Philippines since 1986.",
  video_url: "/media/hero.mp4",
  poster_url: "/media/scuba.jpg",
  primary_cta_label: "Book an activity",
  primary_cta_href: "/scuba",
  secondary_cta_label: "Explore locations",
  secondary_cta_href: "/locations/mactan",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const settings: SiteSettings = (data as SiteSettings | null) ?? {
    id: "",
    business_name: "Scotty's Action Sports Network",
    contact_email: "bookings@divescotty.com",
    whatsapp_number: "+639176312960",
    timezone: "Asia/Manila",
    updated_at: null,
  };

  const timezoneOptions = TIMEZONE_OPTIONS.includes(settings.timezone)
    ? TIMEZONE_OPTIONS
    : [settings.timezone, ...TIMEZONE_OPTIONS];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Admin
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Settings</h1>
          <p className="mt-3 max-w-xl text-sm text-base-content/70">
            Business identity, customer touchpoints, and localization. These values
            appear on public booking confirmations and admin notifications.
          </p>
        </div>
        {settings.updated_at ? (
          <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/55">
            Last updated · {formatDate(settings.updated_at)}
          </p>
        ) : null}
      </header>

      <form
        action={upsertSiteSettings}
        data-loading-message="Saving settings…"
        encType="multipart/form-data"
        className="flex flex-col gap-8"
      >
        <input type="hidden" name="id" value={settings.id} />

        <Section
          title="Business identity"
          description="Shown on the website footer, booking confirmations, and PDFs."
        >
          <Field
            icon={Building2}
            label="Business name"
            name="business_name"
            defaultValue={settings.business_name}
            placeholder="Scotty's Action Sports Network"
            required
          />
          <Field
            icon={Mail}
            label="Contact email"
            name="contact_email"
            type="email"
            defaultValue={settings.contact_email}
            placeholder="bookings@example.com"
            helper="Receives admin notifications when no override email is set."
            required
          />
        </Section>

        <Section
          title="Customer touchpoints"
          description="How customers reach you outside the website."
        >
          <Field
            icon={MessageCircle}
            label="WhatsApp number"
            name="whatsapp_number"
            type="tel"
            defaultValue={settings.whatsapp_number}
            placeholder="+639170000000"
            helper="Include country code. Used on the public WhatsApp button."
            required
          />
        </Section>

        <Section
          title="Homepage hero"
          description="Background video, headline, and call-to-actions for the top of the homepage."
        >
          <HeroPreview
            posterUrl={settings.hero_poster_url || HERO_DEFAULTS.poster_url}
            title={settings.hero_title || HERO_DEFAULTS.title}
            eyebrow={settings.hero_eyebrow || HERO_DEFAULTS.eyebrow}
            videoUrl={settings.hero_video_url || HERO_DEFAULTS.video_url}
            isCustomVideo={Boolean(settings.hero_video_url)}
            isCustomPoster={Boolean(settings.hero_poster_url)}
            className="md:col-span-2"
          />
          <Field
            icon={Tag}
            label="Eyebrow"
            name="hero_eyebrow"
            defaultValue={settings.hero_eyebrow ?? ""}
            placeholder={HERO_DEFAULTS.eyebrow}
            helper="Small caps label above the title."
          />
          <Field
            icon={Heading2}
            label="Title"
            name="hero_title"
            defaultValue={settings.hero_title ?? ""}
            placeholder={HERO_DEFAULTS.title}
            helper="Big display headline."
          />
          <TextareaField
            icon={TypeIcon}
            label="Subtitle"
            name="hero_subtitle"
            defaultValue={settings.hero_subtitle ?? ""}
            placeholder={HERO_DEFAULTS.subtitle}
            helper="One short paragraph beneath the title."
            rows={3}
            className="md:col-span-2"
          />
          <FileField
            icon={Film}
            label="Background video"
            name="hero_video_file"
            currentName="hero_video_url_current"
            currentUrl={settings.hero_video_url}
            removeName="hero_video_remove"
            accept="video/mp4"
            helper="MP4 up to 50MB. Leave empty to keep the current file."
          />
          <FileField
            icon={ImageIcon}
            label="Poster image"
            name="hero_poster_file"
            currentName="hero_poster_url_current"
            currentUrl={settings.hero_poster_url}
            removeName="hero_poster_remove"
            accept="image/png,image/jpeg"
            helper="PNG or JPEG up to 5MB. Used as the video poster and as a fallback image."
          />
          <Field
            icon={MousePointerClick}
            label="Primary CTA label"
            name="hero_primary_cta_label"
            defaultValue={settings.hero_primary_cta_label ?? ""}
            placeholder={HERO_DEFAULTS.primary_cta_label}
            helper="Leave blank to hide the button."
          />
          <Field
            icon={LinkIcon}
            label="Primary CTA link"
            name="hero_primary_cta_href"
            defaultValue={settings.hero_primary_cta_href ?? ""}
            placeholder={HERO_DEFAULTS.primary_cta_href}
            helper="Relative path or full URL."
          />
          <Field
            icon={Sparkles}
            label="Secondary CTA label"
            name="hero_secondary_cta_label"
            defaultValue={settings.hero_secondary_cta_label ?? ""}
            placeholder={HERO_DEFAULTS.secondary_cta_label}
            helper="Optional outline button."
          />
          <Field
            icon={LinkIcon}
            label="Secondary CTA link"
            name="hero_secondary_cta_href"
            defaultValue={settings.hero_secondary_cta_href ?? ""}
            placeholder={HERO_DEFAULTS.secondary_cta_href}
            helper="Relative path or full URL."
          />
        </Section>

        <Section
          title="Localization"
          description="Times shown in admin and emails use this timezone."
        >
          <SelectField
            icon={Globe2}
            label="Timezone"
            name="timezone"
            defaultValue={settings.timezone}
            options={timezoneOptions}
            helper="IANA timezone name."
            required
          />
        </Section>

        <div className="flex flex-col gap-3 border-t border-base-content/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-base-content/60">
            Changes apply immediately across the public site and admin.
          </p>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 text-xs uppercase tracking-[0.32em] text-primary-content shadow-sm transition hover:bg-primary/90"
          >
            <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
            Save settings
          </button>
        </div>
      </form>

      <aside className="border border-base-content/10 bg-base-200/40 p-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/60">
          Related
        </p>
        <h2 className="font-display mt-2 text-lg uppercase">Operations</h2>
        <p className="mt-2 text-sm text-base-content/70">
          Trip cost defaults used to calculate quotations and profit per booking.
        </p>
        <Link
          href="/admin/cost-templates"
          className="mt-4 inline-flex items-center gap-2 border border-base-content/35 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
        >
          <Clock className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Open cost templates
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </aside>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 border border-base-content/10 bg-base-200/30 p-6 md:grid-cols-[260px_minmax(0,1fr)]">
      <div>
        <h2 className="font-display text-base uppercase tracking-[0.18em]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-xs text-base-content/65">{description}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldShell({
  icon: Icon,
  label,
  helper,
  children,
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </span>
      {children}
      {helper ? (
        <span className="text-[11px] leading-relaxed text-base-content/55">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function Field({
  icon,
  label,
  helper,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell icon={icon} label={label} helper={helper}>
      <input className="input input-bordered w-full bg-base-100" {...rest} />
    </FieldShell>
  );
}

function SelectField({
  icon,
  label,
  helper,
  options,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  options: string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell icon={icon} label={label} helper={helper}>
      <select className="select select-bordered w-full bg-base-100" {...rest}>
        {options.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function TextareaField({
  icon,
  label,
  helper,
  className,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  helper?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <FieldShell icon={icon} label={label} helper={helper}>
        <textarea
          className="textarea textarea-bordered w-full bg-base-100 leading-relaxed"
          {...rest}
        />
      </FieldShell>
    </div>
  );
}

function FileField({
  icon,
  label,
  name,
  currentName,
  currentUrl,
  removeName,
  accept,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  currentName: string;
  currentUrl: string | null | undefined;
  removeName?: string;
  accept: string;
  helper?: string;
}) {
  const fileName = currentUrl ? currentUrl.split("/").pop() ?? "" : "";
  return (
    <FieldShell icon={icon} label={label} helper={helper}>
      <input type="hidden" name={currentName} value={currentUrl ?? ""} />
      <input
        type="file"
        name={name}
        accept={accept}
        className="file-input file-input-bordered w-full bg-base-100"
      />
      {currentUrl ? (
        <div className="mt-1 flex flex-col gap-1.5 text-[11px] text-base-content/55">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Current:&nbsp;
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate underline-offset-2 hover:underline"
              title={currentUrl}
            >
              {fileName || currentUrl}
            </a>
          </span>
          {removeName ? (
            <label className="inline-flex cursor-pointer items-center gap-2 self-start text-[11px] text-base-content/65">
              <input
                type="checkbox"
                name={removeName}
                value="1"
                className="checkbox checkbox-xs"
              />
              Revert to default on save
            </label>
          ) : null}
        </div>
      ) : (
        <span className="mt-1 text-[11px] text-base-content/45">
          No file uploaded yet — using the bundled default.
        </span>
      )}
    </FieldShell>
  );
}

function HeroPreview({
  posterUrl,
  videoUrl,
  title,
  eyebrow,
  isCustomVideo,
  isCustomPoster,
  className,
}: {
  posterUrl: string;
  videoUrl: string;
  title: string;
  eyebrow: string;
  isCustomVideo: boolean;
  isCustomPoster: boolean;
  className?: string;
}) {
  const isExternal = posterUrl.startsWith("http");
  const videoStatus = isCustomVideo
    ? { label: "Custom video", tone: "success" as const }
    : videoUrl
      ? { label: "Default video", tone: "neutral" as const }
      : { label: "Image only", tone: "warning" as const };
  const posterStatus = isCustomPoster
    ? { label: "Custom poster", tone: "success" as const }
    : { label: "Default poster", tone: "neutral" as const };

  return (
    <div className={className}>
      <div className="overflow-hidden border border-base-content/10 bg-base-300">
        <div className="relative aspect-video w-full">
          {posterUrl ? (
            isExternal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt="Hero preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={posterUrl}
                alt="Hero preview"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
            )
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs uppercase tracking-[0.28em] text-base-content/40">
              No poster
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
            <span className="text-[9px] uppercase tracking-[0.32em] opacity-80">
              {eyebrow}
            </span>
            <span className="font-display text-xl uppercase leading-tight md:text-2xl">
              {title}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-base-content/10 bg-base-200/50 px-4 py-2.5 text-[10px] uppercase tracking-[0.24em] text-base-content/60 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <PreviewBadge icon={Film} label={videoStatus.label} tone={videoStatus.tone} />
            <PreviewBadge icon={ImageIcon} label={posterStatus.label} tone={posterStatus.tone} />
          </div>
          <span
            className="truncate normal-case tracking-normal text-[10px] text-base-content/45"
            title={videoUrl || posterUrl}
          >
            {videoUrl || posterUrl}
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewBadge({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: "success" | "neutral" | "warning";
}) {
  const toneClasses: Record<typeof tone, string> = {
    success: "border-success/40 bg-success/10 text-success-content",
    neutral: "border-base-content/20 bg-base-100 text-base-content/65",
    warning: "border-warning/40 bg-warning/10 text-warning-content",
  };
  const dotClasses: Record<typeof tone, string> = {
    success: "bg-success",
    neutral: "bg-base-content/40",
    warning: "bg-warning",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] uppercase tracking-[0.24em] ${toneClasses[tone]}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} aria-hidden />
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}
