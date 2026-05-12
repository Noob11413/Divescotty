alter table public.activity_cost_templates
  add column if not exists default_tank_qty integer not null default 0 check (default_tank_qty >= 0),
  add column if not exists default_tank_unit_cost_cents integer not null default 0 check (default_tank_unit_cost_cents >= 0),
  add column if not exists default_gear_qty integer not null default 0 check (default_gear_qty >= 0),
  add column if not exists default_gear_unit_cost_cents integer not null default 0 check (default_gear_unit_cost_cents >= 0);

alter table public.bookings
  add column if not exists tank_qty integer not null default 0 check (tank_qty >= 0),
  add column if not exists tank_unit_cost_cents integer not null default 0 check (tank_unit_cost_cents >= 0),
  add column if not exists gear_qty integer not null default 0 check (gear_qty >= 0),
  add column if not exists gear_unit_cost_cents integer not null default 0 check (gear_unit_cost_cents >= 0);
