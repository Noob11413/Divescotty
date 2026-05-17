import {
  Anchor,
  Briefcase,
  CircleDollarSign,
  Clock,
  Fuel,
  Hash,
  Save,
  Settings2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { upsertActivityCostTemplate } from "@/app/actions/cost-templates";
import { PhpMoneyInput } from "@/components/ui/PhpMoneyInput";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ActivityRow = {
  id: string;
  name: string;
  category?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

type TemplateRow = {
  activity_id: string;
  default_fuel_cost_cents: number;
  default_fuel_hourly_cost_cents: number;
  default_tank_cost_cents: number;
  default_tank_qty: number;
  default_tank_unit_cost_cents: number;
  default_gear_cost_cents: number;
  default_gear_qty: number;
  default_gear_unit_cost_cents: number;
  default_other_cost_cents: number;
  default_instructor_hours: number;
};

export default async function AdminCostTemplatesPage() {
  const supabase = await createClient();
  const [activitiesRes, templatesScopedRes] = await Promise.all([
    supabase
      .from("activities")
      .select("id, name, category:categories(name)")
      .order("name"),
    supabase
      .from("activity_cost_templates")
      .select(
        "activity_id, default_fuel_cost_cents, default_fuel_hourly_cost_cents, default_tank_cost_cents, default_tank_qty, default_tank_unit_cost_cents, default_gear_cost_cents, default_gear_qty, default_gear_unit_cost_cents, default_other_cost_cents, default_instructor_hours",
      ),
  ]);

  const activities = (activitiesRes.data ?? []) as ActivityRow[];
  let templates = (templatesScopedRes.data ?? []) as TemplateRow[];
  if (templatesScopedRes.error) {
    const templatesFallbackRes = await supabase
      .from("activity_cost_templates")
      .select(
        "activity_id, default_fuel_cost_cents, default_tank_cost_cents, default_gear_cost_cents, default_other_cost_cents, default_instructor_hours",
      );
    templates = ((templatesFallbackRes.data ?? []) as Array<{
      activity_id: string;
      default_fuel_cost_cents: number;
      default_tank_cost_cents: number;
      default_gear_cost_cents: number;
      default_other_cost_cents: number;
      default_instructor_hours: number;
    }>).map((row) => ({
      ...row,
      default_fuel_hourly_cost_cents: 0,
      default_tank_qty: 0,
      default_tank_unit_cost_cents: 0,
      default_gear_qty: 0,
      default_gear_unit_cost_cents: 0,
    }));
  }
  const templateByActivityId = new Map(templates.map((t) => [t.activity_id, t]));
  const configured = activities.filter((a) => templateByActivityId.has(a.id)).length;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
            Operations
          </p>
          <h1 className="font-display mt-2 text-4xl uppercase">Cost templates</h1>
          <p className="mt-3 max-w-xl text-sm text-base-content/70">
            Per-activity defaults used to auto-calculate quotations and profit on
            every booking. Fixed costs plus per-piece rates for tank and gear.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-base-content/55">
          {configured}/{activities.length} configured
        </p>
      </header>

      {activities.length === 0 ? (
        <div className="border border-base-content/10 bg-base-200/30 p-8 text-center text-sm text-base-content/70">
          No activities yet. Create activities first, then return here to set
          their cost defaults.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activities.map((activity) => {
            const category = Array.isArray(activity.category)
              ? activity.category[0]?.name
              : activity.category?.name;
            const tpl = templateByActivityId.get(activity.id);
            const hasTemplate = Boolean(tpl);

            return (
              <form
                key={activity.id}
                action={upsertActivityCostTemplate}
                data-loading-message="Saving template…"
                className="border border-base-content/10 bg-base-100 shadow-sm"
              >
                <input type="hidden" name="activity_id" value={activity.id} />

                <div className="flex flex-col gap-3 border-b border-base-content/10 bg-base-200/40 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Settings2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-display text-lg uppercase tracking-[0.18em]">
                        {activity.name}
                      </h2>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-base-content/60">
                        {category ?? "Uncategorized"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge configured={hasTemplate} />
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                  <CostGroup
                    icon={Fuel}
                    title="Fuel"
                    description="Hourly rate is preferred; fallback is used when hours aren't set."
                  >
                    <PhpMoneyInput
                      icon={<Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                      label="Per hour (PHP)"
                      name="default_fuel_hourly_cost_php"
                      defaultAmountPhp={(tpl?.default_fuel_hourly_cost_cents ?? 0) / 100}
                    />
                    <PhpMoneyInput
                      icon={<CircleDollarSign className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                      label="Fallback flat (PHP)"
                      name="default_fuel_cost_php"
                      defaultAmountPhp={(tpl?.default_fuel_cost_cents ?? 0) / 100}
                    />
                  </CostGroup>

                  <CostGroup
                    icon={Anchor}
                    title="Tank"
                    description="Pieces multiplied by unit cost per trip."
                  >
                    <Field
                      icon={Hash}
                      label="Pieces"
                      name="default_tank_qty"
                      defaultValue={String(tpl?.default_tank_qty ?? 0)}
                      type="number"
                      min={0}
                    />
                    <PhpMoneyInput
                      icon={<CircleDollarSign className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                      label="Unit (PHP)"
                      name="default_tank_unit_cost_php"
                      defaultAmountPhp={(tpl?.default_tank_unit_cost_cents ?? 0) / 100}
                    />
                  </CostGroup>

                  <CostGroup
                    icon={Wrench}
                    title="Gear"
                    description="Pieces multiplied by unit cost per trip."
                  >
                    <Field
                      icon={Hash}
                      label="Pieces"
                      name="default_gear_qty"
                      defaultValue={String(tpl?.default_gear_qty ?? 0)}
                      type="number"
                      min={0}
                    />
                    <PhpMoneyInput
                      icon={<CircleDollarSign className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                      label="Unit (PHP)"
                      name="default_gear_unit_cost_php"
                      defaultAmountPhp={(tpl?.default_gear_unit_cost_cents ?? 0) / 100}
                    />
                  </CostGroup>

                  <div className="md:col-span-3 grid grid-cols-1 gap-4 border-t border-base-content/10 pt-6 md:grid-cols-2">
                    <PhpMoneyInput
                      icon={<Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                      label="Other fixed (PHP)"
                      name="default_other_cost_php"
                      defaultAmountPhp={(tpl?.default_other_cost_cents ?? 0) / 100}
                      helper="Permits, misc fees, or any flat operational cost."
                    />
                    <Field
                      icon={Clock}
                      label="Base instructor hours"
                      name="default_instructor_hours"
                      defaultValue={String(tpl?.default_instructor_hours ?? 0)}
                      type="number"
                      min={0}
                      step="0.5"
                      helper="Used when start/end time aren't entered on a booking."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-base-content/10 bg-base-200/30 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-[11px] text-base-content/60">
                    Changes apply to <span className="font-medium">new bookings</span>;
                    existing bookings keep their saved costs.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-primary-content shadow-sm transition hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Save template
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CostGroup({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border border-base-content/10 bg-base-200/20 p-4">
      <div className="flex items-center gap-2 text-base-content">
        <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
        <span className="font-display text-xs uppercase tracking-[0.24em]">
          {title}
        </span>
      </div>
      {description ? (
        <p className="text-[11px] leading-relaxed text-base-content/55">
          {description}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 self-start border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${
        configured
          ? "border-success/40 bg-success/10 text-success-content"
          : "border-warning/40 bg-warning/10 text-warning-content"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          configured ? "bg-success" : "bg-warning"
        }`}
        aria-hidden
      />
      {configured ? "Configured" : "Defaults"}
    </span>
  );
}

function Field({
  icon: Icon,
  label,
  name,
  defaultValue,
  helper,
  ...rest
}: {
  icon?: LucideIcon;
  label: string;
  name: string;
  defaultValue: string;
  helper?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  return (
    <label className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden /> : null}
        {label}
      </span>
      <input
        className="input input-bordered bg-base-100"
        name={name}
        defaultValue={defaultValue}
        {...rest}
      />
      {helper ? (
        <span className="text-[11px] leading-relaxed text-base-content/55">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
