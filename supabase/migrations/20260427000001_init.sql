-- =====================================================================
-- DiveScotty initial schema
--   * profiles, categories, locations, activities, activity_locations,
--     bookings
--   * RLS-by-default
--   * trigger: auto-create profile on auth.users insert
--   * function: generate human-readable booking reference (SASN-YYYY-NNNN)
--   * function: promote a user to admin (sets app_metadata.role + profile)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ── ENUMS ─────────────────────────────────────────────────────────────
create type public.user_role as enum ('admin', 'customer');
create type public.booking_status as enum (
  'pending', 'confirmed', 'cancelled', 'completed'
);

-- ── HELPER: is_admin() ────────────────────────────────────────────────
-- Reads role from app_metadata (server-set, not user-editable).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ── PROFILES ──────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'customer',
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: self select"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles: admin select"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

create policy "profiles: self update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admin update"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Auto-create profile row when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── CATEGORIES ────────────────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  tagline     text,
  description text,
  icon        text,
  hero_image  text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: public read"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories: admin write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── LOCATIONS ─────────────────────────────────────────────────────────
create table public.locations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  region      text,
  description text,
  hero_image  text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.locations enable row level security;

create policy "locations: public read"
  on public.locations for select
  to anon, authenticated
  using (true);

create policy "locations: admin write"
  on public.locations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── ACTIVITIES ────────────────────────────────────────────────────────
create table public.activities (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  category_id         uuid not null references public.categories(id) on delete restrict,
  name                text not null,
  short_description   text,
  description         text,
  duration_minutes    int,
  price_cents         int,
  currency            text not null default 'PHP',
  min_party           int  not null default 1,
  max_party           int  not null default 20,
  image_url           text,
  gallery_urls        text[],
  availability_label  text,
  is_published        boolean not null default false,
  is_featured         boolean not null default false,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint activities_party_check check (min_party >= 1 and max_party >= min_party)
);

create index activities_category_idx on public.activities (category_id);
create index activities_published_idx on public.activities (is_published) where is_published;
create index activities_featured_idx on public.activities (is_featured) where is_featured;

alter table public.activities enable row level security;

-- Public sees only published activities.
create policy "activities: public read published"
  on public.activities for select
  to anon, authenticated
  using (is_published = true);

-- Admins can see and write everything.
create policy "activities: admin read all"
  on public.activities for select
  to authenticated
  using (public.is_admin());

create policy "activities: admin write"
  on public.activities for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── ACTIVITY_LOCATIONS (M:N) ──────────────────────────────────────────
create table public.activity_locations (
  activity_id uuid not null references public.activities(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (activity_id, location_id)
);

alter table public.activity_locations enable row level security;

create policy "activity_locations: public read"
  on public.activity_locations for select
  to anon, authenticated
  using (true);

create policy "activity_locations: admin write"
  on public.activity_locations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── BOOKING REFERENCE GENERATOR ───────────────────────────────────────
-- Sequence per year would be nicer, but a single sequence is simpler and
-- still produces a stable, ascending, human-readable code. We zero-pad to 4
-- digits but allow it to grow as the count rises.
create sequence public.booking_reference_seq start 1;

create or replace function public.generate_booking_reference()
returns text
language plpgsql
volatile
as $$
declare
  yr text := to_char(now() at time zone 'Asia/Manila', 'YYYY');
  n  bigint := nextval('public.booking_reference_seq');
begin
  return 'SASN-' || yr || '-' || lpad(n::text, 4, '0');
end;
$$;

-- ── BOOKINGS ──────────────────────────────────────────────────────────
create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique default public.generate_booking_reference(),
  activity_id       uuid not null references public.activities(id) on delete restrict,
  location_id       uuid references public.locations(id) on delete set null,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,
  party_size        int  not null,
  preferred_date    date not null,
  preferred_time    time,
  special_requests  text,
  status            public.booking_status not null default 'pending',
  internal_notes    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint bookings_party_check check (party_size between 1 and 200),
  constraint bookings_email_check check (position('@' in customer_email) > 1),
  constraint bookings_date_check  check (preferred_date >= current_date - 1)
);

create index bookings_status_idx        on public.bookings (status);
create index bookings_activity_idx      on public.bookings (activity_id);
create index bookings_preferred_date_idx on public.bookings (preferred_date);
create index bookings_created_at_idx    on public.bookings (created_at desc);

alter table public.bookings enable row level security;

-- Anonymous + authenticated visitors can create a booking request.
-- They cannot read it back; the confirmation page receives the reference
-- through the server action's return value, not via a SELECT.
create policy "bookings: anyone can request"
  on public.bookings for insert
  to anon, authenticated
  with check (
    -- Public requests must start pending.
    status = 'pending'
    -- Internal notes can only be set by admins.
    and internal_notes is null
  );

-- Only admins can read, update, delete bookings.
create policy "bookings: admin read"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

create policy "bookings: admin update"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "bookings: admin delete"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());

-- Updated_at triggers
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch    before update on public.profiles    for each row execute function public.touch_updated_at();
create trigger activities_touch  before update on public.activities  for each row execute function public.touch_updated_at();
create trigger bookings_touch    before update on public.bookings    for each row execute function public.touch_updated_at();

-- Public-safe booking creator that returns reference without exposing
-- booking rows to anon/authenticated callers.
create or replace function public.create_booking_request(
  p_activity_id uuid,
  p_employee_id uuid,
  p_location_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_party_size int,
  p_preferred_date date,
  p_preferred_time time,
  p_special_requests text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference text;
begin
  insert into public.bookings (
    activity_id,
    employee_id,
    location_id,
    customer_name,
    customer_email,
    customer_phone,
    party_size,
    preferred_date,
    preferred_time,
    special_requests,
    status
  )
  values (
    p_activity_id,
    p_employee_id,
    p_location_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_party_size,
    p_preferred_date,
    p_preferred_time,
    p_special_requests,
    'pending'
  )
  returning reference into v_reference;

  return v_reference;
end;
$$;

revoke all on function public.create_booking_request(
  uuid, uuid, uuid, text, text, text, int, date, time, text
) from public;
grant execute on function public.create_booking_request(
  uuid, uuid, uuid, text, text, text, int, date, time, text
) to anon, authenticated;

-- ── ADMIN PROMOTION HELPER ────────────────────────────────────────────
-- Bootstraps the first admin. Sets app_metadata.role on the auth user AND
-- updates the profile row. Run from the Supabase SQL editor (NOT exposed
-- over the API since it's marked security definer + restricted grants).
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then
    raise exception 'No auth user with email %', target_email;
  end if;

  update auth.users
    set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'admin')
  where id = uid;

  update public.profiles set role = 'admin' where id = uid;
end;
$$;

revoke all on function public.promote_to_admin(text) from public;
revoke all on function public.promote_to_admin(text) from anon, authenticated;
-- service_role retains execute by default.
