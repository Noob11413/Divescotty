alter table public.employees
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists credentials_url text,
  add column if not exists expertise_level text,
  add column if not exists certifications text,
  add column if not exists is_active boolean not null default true;

update public.employees
set first_name = split_part(name, ' ', 1)
where first_name is null and name is not null;

update public.employees
set last_name = nullif(trim(substr(name, length(split_part(name, ' ', 1)) + 1)), '')
where last_name is null and name is not null;

create index if not exists employees_active_idx on public.employees (is_active);
