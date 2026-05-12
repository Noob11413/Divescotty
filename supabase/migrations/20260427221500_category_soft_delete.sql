alter table public.categories
  add column if not exists deleted_at timestamptz;

create index if not exists categories_deleted_at_idx
  on public.categories (deleted_at);
