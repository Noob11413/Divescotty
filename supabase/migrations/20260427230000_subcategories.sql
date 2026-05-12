create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

create index if not exists subcategories_category_idx
  on public.subcategories (category_id, sort_order);
create index if not exists subcategories_deleted_at_idx
  on public.subcategories (deleted_at);

alter table public.subcategories enable row level security;

drop policy if exists "subcategories: public read" on public.subcategories;
create policy "subcategories: public read"
  on public.subcategories for select
  to anon, authenticated
  using (true);

drop policy if exists "subcategories: admin write" on public.subcategories;
create policy "subcategories: admin write"
  on public.subcategories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.activities
  add column if not exists subcategory_id uuid
  references public.subcategories(id) on delete set null;

create index if not exists activities_subcategory_idx
  on public.activities (subcategory_id);
