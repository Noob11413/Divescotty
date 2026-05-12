import { upsertActivityCostTemplate } from "@/app/actions/cost-templates";
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
    // Backward-compat: if latest columns are missing in DB, fallback to base columns.
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

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
          Operations
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase">Cost templates</h1>
        <p className="mt-2 text-sm text-base-content/70">
          Keep this simple: fixed trip costs plus per-piece rates for tank and gear.
        </p>
      </header>

      <div className="space-y-4">
        {activities.map((activity) => {
          const category = Array.isArray(activity.category)
            ? activity.category[0]?.name
            : activity.category?.name;
          const tpl = templateByActivityId.get(activity.id);
          return (
            <form
              key={activity.id}
              action={upsertActivityCostTemplate}
              className="grid grid-cols-1 gap-3 border border-base-content/10 bg-base-100 p-4 md:grid-cols-12"
            >
              <input type="hidden" name="activity_id" value={activity.id} />
              <div className="md:col-span-3">
                <p className="font-medium">{activity.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                  {category ?? "Uncategorized"}
                </p>
              </div>
              <Field
                label="Fuel per hour (PHP)"
                name="default_fuel_hourly_cost_php"
                defaultValue={toPhpString(tpl?.default_fuel_hourly_cost_cents)}
                className="md:col-span-2"
              />
              <Field
                label="Fuel fallback (PHP)"
                name="default_fuel_cost_php"
                defaultValue={toPhpString(tpl?.default_fuel_cost_cents)}
                className="md:col-span-2"
              />
              <Field
                label="Tank pieces"
                name="default_tank_qty"
                defaultValue={String(tpl?.default_tank_qty ?? 0)}
                className="md:col-span-1"
              />
              <Field
                label="Tank unit (PHP)"
                name="default_tank_unit_cost_php"
                defaultValue={toPhpString(tpl?.default_tank_unit_cost_cents)}
                className="md:col-span-2"
              />
              <Field
                label="Gear pieces"
                name="default_gear_qty"
                defaultValue={String(tpl?.default_gear_qty ?? 0)}
                className="md:col-span-1"
              />
              <Field
                label="Gear unit (PHP)"
                name="default_gear_unit_cost_php"
                defaultValue={toPhpString(tpl?.default_gear_unit_cost_cents)}
                className="md:col-span-2"
              />
              <Field
                label="Other fixed (PHP)"
                name="default_other_cost_php"
                defaultValue={toPhpString(tpl?.default_other_cost_cents)}
                className="md:col-span-2"
              />
              <Field
                label="Base instructor hrs"
                name="default_instructor_hours"
                defaultValue={String(tpl?.default_instructor_hours ?? 0)}
                className="md:col-span-2"
              />
              <div className="md:col-span-12 flex justify-end">
                <button
                  type="submit"
                  className="bg-primary px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary-content hover:bg-primary/90"
                >
                  Save template
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.32em] text-base-content/60">
        {label}
      </span>
      <input
        className="input input-bordered bg-base-100"
        name={name}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function toPhpString(cents: number | undefined) {
  return cents == null ? "0" : (cents / 100).toString();
}
