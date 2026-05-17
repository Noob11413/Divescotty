-- Public-read storage bucket for editable site assets (hero video + poster).
-- Files are written by admins from the admin/settings page; URLs are stored
-- back in public.site_settings (hero_video_url, hero_poster_url).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  52428800, -- 50 MB
  array['video/mp4', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public read so the marketing site (anon) can stream the video / load the poster.
drop policy if exists "site-assets: public read" on storage.objects;
create policy "site-assets: public read"
  on storage.objects for select
  using (bucket_id = 'site-assets');

-- Admin-only writes. INSERT + UPDATE + DELETE are all required to support upsert.
drop policy if exists "site-assets: admin insert" on storage.objects;
create policy "site-assets: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "site-assets: admin update" on storage.objects;
create policy "site-assets: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "site-assets: admin delete" on storage.objects;
create policy "site-assets: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin());
