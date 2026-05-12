alter table public.activity_cost_templates
  add column if not exists default_fuel_hourly_cost_cents integer not null default 0
    check (default_fuel_hourly_cost_cents >= 0);
