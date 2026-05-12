-- ── EMPLOYEE MODEL ───────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'employee_role' and n.nspname = 'public'
  ) then
    create type public.employee_role as enum (
      'employee',
      'tourguide',
      'scubaguide',
      'instructor'
    );
  end if;
end $$;

create table if not exists public.employees (
  id            uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  name          text not null,
  role          public.employee_role not null default 'employee',
  photo_url     text,
  phone         text,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.employees enable row level security;

drop policy if exists "employees: public read" on public.employees;
create policy "employees: public read"
  on public.employees for select
  to anon, authenticated
  using (true);

drop policy if exists "employees: admin insert" on public.employees;
create policy "employees: admin insert"
  on public.employees for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "employees: admin update" on public.employees;
create policy "employees: admin update"
  on public.employees for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "employees: admin delete" on public.employees;
create policy "employees: admin delete"
  on public.employees for delete
  to authenticated
  using (public.is_admin());

drop trigger if exists employees_touch on public.employees;
create trigger employees_touch
  before update on public.employees
  for each row execute function public.touch_updated_at();

-- Backfill employees from previously created tour_guides table if present.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'tour_guides'
  ) then
    execute $m$
      insert into public.employees (
        id, employee_code, name, role, photo_url, phone, email, created_at, updated_at
      )
      select
        tg.id,
        tg.guide_code,
        tg.name,
        'tourguide'::public.employee_role,
        null, null, null,
        tg.created_at,
        tg.updated_at
      from public.tour_guides tg
      on conflict (employee_code) do update
      set name = excluded.name,
          role = excluded.role,
          updated_at = now()
    $m$;
  end if;
end $$;

alter table public.bookings
  add column if not exists employee_id uuid
  references public.employees(id) on delete set null;

create index if not exists bookings_employee_idx on public.bookings (employee_id);

-- Backfill bookings.employee_id from old bookings.tour_guide_id if present.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bookings'
      and column_name = 'tour_guide_id'
  ) then
    execute $m$
      update public.bookings
      set employee_id = tour_guide_id
      where employee_id is null and tour_guide_id is not null
    $m$;
  end if;
end $$;

insert into public.employees (employee_code, name, role, phone, email)
values
  ('EMP-001', 'Scotty Reyes', 'tourguide', '+63 917 111 0001', 'scotty.reyes@example.com'),
  ('EMP-002', 'Mika Dela Cruz', 'scubaguide', '+63 917 111 0002', 'mika.delacruz@example.com'),
  ('EMP-003', 'Ramon Santos', 'instructor', '+63 917 111 0003', 'ramon.santos@example.com')
on conflict (employee_code) do nothing;
