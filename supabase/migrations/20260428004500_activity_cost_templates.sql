create table if not exists public.activity_cost_templates (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null unique references public.activities(id) on delete cascade,
  default_fuel_cost_cents integer not null default 0 check (default_fuel_cost_cents >= 0),
  default_tank_cost_cents integer not null default 0 check (default_tank_cost_cents >= 0),
  default_gear_cost_cents integer not null default 0 check (default_gear_cost_cents >= 0),
  default_other_cost_cents integer not null default 0 check (default_other_cost_cents >= 0),
  default_instructor_hours numeric(6,2) not null default 0 check (default_instructor_hours >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists activity_cost_templates_touch on public.activity_cost_templates;
create trigger activity_cost_templates_touch
before update on public.activity_cost_templates
for each row execute function public.touch_updated_at();

alter table public.activity_cost_templates enable row level security;

drop policy if exists "activity cost templates: admin read" on public.activity_cost_templates;
create policy "activity cost templates: admin read"
  on public.activity_cost_templates
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "activity cost templates: admin write" on public.activity_cost_templates;
create policy "activity cost templates: admin write"
  on public.activity_cost_templates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
