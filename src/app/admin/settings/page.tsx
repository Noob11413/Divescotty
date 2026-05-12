import { upsertSiteSettings } from "@/app/actions/settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const settings = (data as {
    id: string;
    business_name: string;
    contact_email: string;
    whatsapp_number: string;
    timezone: string;
  } | null) ?? {
    id: "",
    business_name: "Scotty's Action Sports Network",
    contact_email: "bookings@divescotty.com",
    whatsapp_number: "+639176312960",
    timezone: "Asia/Manila",
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Admin
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase">Settings</h1>
        <div className="mt-4">
          <Link
            href="/admin/cost-templates"
            className="inline-flex items-center border border-base-content/35 px-4 py-2 text-xs uppercase tracking-[0.28em] hover:bg-base-content hover:text-base-100"
          >
            Open cost templates
          </Link>
        </div>
      </header>

      <form
        action={upsertSiteSettings}
        className="grid grid-cols-1 gap-4 border border-base-content/10 bg-base-200/40 p-6 md:grid-cols-2"
      >
        <input type="hidden" name="id" value={settings.id} />
        <Field
          label="Business name"
          name="business_name"
          defaultValue={settings.business_name}
          required
        />
        <Field
          label="Contact email"
          name="contact_email"
          type="email"
          defaultValue={settings.contact_email}
          required
        />
        <Field
          label="WhatsApp number"
          name="whatsapp_number"
          defaultValue={settings.whatsapp_number}
          required
        />
        <Field
          label="Timezone"
          name="timezone"
          defaultValue={settings.timezone}
          required
        />
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="bg-primary px-6 py-2 text-xs uppercase tracking-[0.32em] text-primary-content hover:bg-primary/90"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input className="input input-bordered bg-base-100" {...rest} />
    </label>
  );
}
