-- Add editable homepage hero fields to site_settings.
-- Stored as plain text/URLs; uploads can be wired up later (see Supabase Storage).

alter table public.site_settings
  add column if not exists hero_eyebrow text,
  add column if not exists hero_title text,
  add column if not exists hero_subtitle text,
  add column if not exists hero_video_url text,
  add column if not exists hero_poster_url text,
  add column if not exists hero_primary_cta_label text,
  add column if not exists hero_primary_cta_href text,
  add column if not exists hero_secondary_cta_label text,
  add column if not exists hero_secondary_cta_href text;
