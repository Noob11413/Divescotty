-- Sample activities for local development. Re-run safe via `on conflict`.
-- This file is loaded automatically by `supabase db reset`.

with c as (
  select id, slug from public.categories
), l as (
  select id, slug from public.locations
)
insert into public.activities
  (slug, category_id, name, short_description, description, duration_minutes,
   price_cents, currency, min_party, max_party, image_url,
   availability_label, is_published, is_featured, sort_order)
values
  -- ── SCUBA ──────────────────────────────────────────────────────────
  ('discover-scuba',
   (select id from c where slug = 'scuba'),
   'Discover Scuba Diving',
   'Your first underwater breath, with a private instructor at your side.',
   'No certification required. We start in shallow, calm water for orientation, then take a single guided dive on a reef no deeper than 12 metres. All gear, instructor, and boat included.',
   240, 750000, 'PHP', 1, 4,
   '/media/scuba.jpg',
   'Available daily',
   true, true, 1),

  ('open-water-course',
   (select id from c where slug = 'scuba'),
   'PADI Open Water Diver',
   'Three days. One certification you keep for life.',
   'The world''s most popular dive course. Theory, confined water sessions, and four open-water training dives. Includes PADI eLearning, all rental gear, and certification fees.',
   2160, 2400000, 'PHP', 1, 6,
   '/media/scuba.jpg',
   'Available year-round',
   true, true, 2),

  ('balicasag-day-trip',
   (select id from c where slug = 'scuba'),
   'Balicasag Marine Sanctuary',
   'Two-tank dive at one of the Philippines'' most photographed walls.',
   'A full-day boat trip out of Panglao to Balicasag Island. Two dives at Black Forest and Diver''s Heaven, schools of jacks and barracuda, lunch on the sandbar.',
   480, 580000, 'PHP', 2, 8,
   '/media/scuba.jpg',
   'Seasonal · Apr–Jun best',
   true, false, 3),

  -- ── FREEDIVING ─────────────────────────────────────────────────────
  ('try-freediving',
   (select id from c where slug = 'freediving'),
   'Try Freediving',
   'A half-day intro to apnea, breath-hold and equalisation.',
   'Learn diaphragmatic breathing, equalisation drills, and safety protocols. Pool session followed by an open-water dive to a comfortable 5–10m. Ideal for swimmers ready to go deeper on a single breath.',
   180, 380000, 'PHP', 1, 4,
   '/media/freedive.jpg',
   'Available daily',
   true, true, 4),

  ('aida-2-course',
   (select id from c where slug = 'freediving'),
   'AIDA 2 Freediver',
   'Two days to your first 16m on a single breath.',
   'Theory, static apnea, dynamic apnea, and constant-weight freediving to 16m. Earn your AIDA 2 certification, recognised worldwide.',
   1080, 1800000, 'PHP', 1, 4,
   '/media/freedive.jpg',
   'Year-round',
   true, false, 5),

  ('mermaid-monofin',
   (select id from c where slug = 'freediving'),
   'Mermaid Monofin School',
   'Slip into a tail and find your inner siren.',
   'Learn to glide with a monofin in costume. Safety briefing, in-water technique, photo session at the surface and just below.',
   120, 290000, 'PHP', 1, 6,
   '/media/freedive.jpg',
   'Available daily',
   true, false, 6),

  -- ── WATERSPORTS ────────────────────────────────────────────────────
  ('parasailing',
   (select id from c where slug = 'watersports'),
   'Parasailing',
   '15 minutes airborne over the reef.',
   'Strap into our tow harness behind a speedboat and rise 100m above the water. Solo or tandem. Wet-launch and dry-launch options.',
   60, 180000, 'PHP', 1, 2,
   '/media/watersports.jpg',
   'Daily · weather permitting',
   true, true, 7),

  ('jet-ski-rental',
   (select id from c where slug = 'watersports'),
   'Jet Ski Rental',
   '30 minutes of throttle. Bring a friend.',
   'Two-seater Yamaha WaveRunners, full briefing, life vest and a marshalled course. No license required for first-timers.',
   30, 220000, 'PHP', 1, 2,
   '/media/watersports.jpg',
   'Daily',
   true, false, 8),

  ('flyfish-ride',
   (select id from c where slug = 'watersports'),
   'Flyfish Ride',
   'The inflatable that flies. Up to 4 riders.',
   'Hold on tight. Our towed flyfish lifts off the water at speed — the closest thing to surfing without a board.',
   20, 150000, 'PHP', 2, 4,
   '/media/watersports.jpg',
   'Daily',
   true, false, 9),

  -- ── ISLAND TOURS ───────────────────────────────────────────────────
  ('island-hopping-mactan',
   (select id from c where slug = 'island-tours'),
   'Mactan Island Hop',
   'Three islands, snorkel stops, lunch on the boat.',
   'A relaxed full-day cruise around Hilutungan, Nalusuan and Caohagan. Two snorkel stops over coral gardens, and a Filipino seafood lunch served on board.',
   360, 350000, 'PHP', 2, 12,
   '/media/island-tour.jpg',
   'Daily · 8am departure',
   true, true, 10),

  ('sunset-cruise',
   (select id from c where slug = 'island-tours'),
   'Olango Sunset Cruise',
   'Golden hour over the Mactan channel.',
   'Two-hour cruise timed to the sunset. Sparkling wine, local bites, calm cruising waters. Perfect for couples, families and proposals.',
   120, 250000, 'PHP', 2, 12,
   '/media/island-tour.jpg',
   'Daily · 4:30pm',
   true, false, 11),

  ('deep-sea-fishing',
   (select id from c where slug = 'island-tours'),
   'Deep Sea Game Fishing',
   'Trolling for marlin, mahi and tuna.',
   'A full-day charter with experienced crew, all tackle, ice and lunch. Catch-and-cook on request.',
   480, 1500000, 'PHP', 1, 6,
   '/media/island-tour.jpg',
   'Seasonal · Mar–Oct best',
   true, false, 12)
on conflict (slug) do update set
  category_id        = excluded.category_id,
  name               = excluded.name,
  short_description  = excluded.short_description,
  description        = excluded.description,
  duration_minutes   = excluded.duration_minutes,
  price_cents        = excluded.price_cents,
  min_party          = excluded.min_party,
  max_party          = excluded.max_party,
  image_url          = excluded.image_url,
  availability_label = excluded.availability_label,
  is_published       = excluded.is_published,
  is_featured        = excluded.is_featured,
  sort_order         = excluded.sort_order;

-- Activity ↔ Location wiring.
-- mactan = scuba beginners + every watersport + Mactan island hop + sunset cruise + game fishing
-- panglao = scuba intermediate / Balicasag day trip + freediving + game fishing
-- boracay = parasailing, flyfish, jet ski, sunset cruise (and every freediving / scuba intro)
insert into public.activity_locations (activity_id, location_id)
select a.id, l.id
from public.activities a
cross join public.locations l
where (a.slug, l.slug) in (
  ('discover-scuba',         'mactan'),
  ('discover-scuba',         'panglao'),
  ('discover-scuba',         'boracay'),
  ('open-water-course',      'mactan'),
  ('open-water-course',      'panglao'),
  ('balicasag-day-trip',     'panglao'),
  ('try-freediving',         'mactan'),
  ('try-freediving',         'panglao'),
  ('try-freediving',         'boracay'),
  ('aida-2-course',          'panglao'),
  ('aida-2-course',          'mactan'),
  ('mermaid-monofin',        'mactan'),
  ('mermaid-monofin',        'boracay'),
  ('parasailing',            'mactan'),
  ('parasailing',            'boracay'),
  ('jet-ski-rental',         'mactan'),
  ('jet-ski-rental',         'boracay'),
  ('flyfish-ride',           'mactan'),
  ('flyfish-ride',           'boracay'),
  ('island-hopping-mactan',  'mactan'),
  ('sunset-cruise',          'mactan'),
  ('sunset-cruise',          'boracay'),
  ('deep-sea-fishing',       'mactan'),
  ('deep-sea-fishing',       'panglao')
)
on conflict (activity_id, location_id) do nothing;
