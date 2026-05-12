create table if not exists public.custom_booking_requests (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null default public.generate_booking_reference(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  preferred_date date null,
  preferred_time text null,
  party_size integer not null default 1 check (party_size > 0 and party_size <= 80),
  location_id uuid null references public.locations(id) on delete set null,
  budget_notes text null,
  request_details text not null,
  flexibility text not null default 'flexible' check (flexibility in ('fixed', 'flexible')),
  status text not null default 'new' check (status in ('new', 'quoted', 'approved', 'rejected', 'converted')),
  admin_notes text null,
  employee_id uuid null references public.employees(id) on delete set null,
  booking_id uuid null references public.bookings(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists custom_booking_requests_status_idx
  on public.custom_booking_requests(status);
create index if not exists custom_booking_requests_created_at_idx
  on public.custom_booking_requests(created_at desc);

drop trigger if exists trg_custom_booking_requests_touch_updated_at on public.custom_booking_requests;
create trigger trg_custom_booking_requests_touch_updated_at
before update on public.custom_booking_requests
for each row execute function public.touch_updated_at();

alter table public.custom_booking_requests enable row level security;

drop policy if exists "custom requests: anyone can create" on public.custom_booking_requests;
create policy "custom requests: anyone can create"
on public.custom_booking_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "custom requests: admins manage all" on public.custom_booking_requests;
create policy "custom requests: admins manage all"
on public.custom_booking_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
