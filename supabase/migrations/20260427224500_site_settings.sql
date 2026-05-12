create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Scotty''s Action Sports Network',
  contact_email text not null default 'bookings@divescotty.com',
  whatsapp_number text not null default '+639176312960',
  timezone text not null default 'Asia/Manila',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings: admin write" on public.site_settings;
create policy "site_settings: admin write"
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

insert into public.site_settings (business_name, contact_email, whatsapp_number, timezone)
values ('Scotty''s Action Sports Network', 'bookings@divescotty.com', '+639176312960', 'Asia/Manila')
on conflict do nothing;
