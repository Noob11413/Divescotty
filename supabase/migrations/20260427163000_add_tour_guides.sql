-- ── TOUR GUIDES ──────────────────────────────────────────────────────────
create table if not exists public.tour_guides (
  id            uuid primary key default gen_random_uuid(),
  guide_code    text not null unique,
  name          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.tour_guides enable row level security;

create policy "tour_guides: admin read"
  on public.tour_guides for select
  to authenticated
  using (public.is_admin());

create policy "tour_guides: admin insert"
  on public.tour_guides for insert
  to authenticated
  with check (public.is_admin());

create policy "tour_guides: admin update"
  on public.tour_guides for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "tour_guides: admin delete"
  on public.tour_guides for delete
  to authenticated
  using (public.is_admin());

create trigger tour_guides_touch
  before update on public.tour_guides
  for each row execute function public.touch_updated_at();

-- Optional relation on bookings for guide assignment
alter table public.bookings
  add column if not exists tour_guide_id uuid
  references public.tour_guides(id) on delete set null;

create index if not exists bookings_tour_guide_idx on public.bookings (tour_guide_id);

-- Seed a couple of guides for dashboard/testing
insert into public.tour_guides (guide_code, name)
values
  ('TG-001', 'Scotty Reyes'),
  ('TG-002', 'Mika Dela Cruz')
on conflict (guide_code) do nothing;
