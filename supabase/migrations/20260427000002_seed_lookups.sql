-- Seed the four pillars (categories) and three locations.
-- Slugs are stable; everything else is editable from the admin UI.

insert into public.categories (slug, name, tagline, description, hero_image, sort_order) values
  ('scuba',
   'Scuba Diving',
   'Reefs, walls and wrecks since 1986',
   'PADI and GUE-certified instruction from beginner Open Water through technical CCR. Dive Balicasag, Pescador, the Danajon double barrier reef and dozens of sites across the Visayas.',
   '/media/scuba.jpg',
   1),
  ('freediving',
   'Freediving',
   'One breath. Infinite blue.',
   'Apnea courses, monofin training, and mermaid school in glass-clear water. Build your breath-hold with patient instructors who teach safety first.',
   '/media/freedive.jpg',
   2),
  ('watersports',
   'Watersports',
   'On the water, above it, around it',
   'Parasailing, jet skis, banana boats, flyfish rides, water skiing — every speedboat-towed thrill the islands allow.',
   '/media/watersports.jpg',
   3),
  ('island-tours',
   'Island Tours',
   'Hopping the Visayan archipelago',
   'Private island hopping, sunset cruises, deep-sea fishing and chartered boats. Curated routes around Cebu, Bohol and Boracay.',
   '/media/island-tour.jpg',
   4)
on conflict (slug) do update
  set name        = excluded.name,
      tagline     = excluded.tagline,
      description = excluded.description,
      hero_image  = excluded.hero_image,
      sort_order  = excluded.sort_order;

insert into public.locations (slug, name, region, description, hero_image, sort_order) values
  ('mactan',
   'Cebu & Mactan',
   'Visayas',
   'Our headquarters at Punta Engaño, Mactan Island. Closest to the international airport — the easiest jumping-off point for Hilutungan, Olango and Nalusuan reefs.',
   '/media/watersports.jpg',
   1),
  ('panglao',
   'Bohol & Panglao',
   'Visayas',
   'Panglao Island, the gateway to Balicasag and Pamilacan. Dolphin watch, walls dropping to 60m, and the legendary Cabilao thresher reefs.',
   '/media/scuba.jpg',
   2),
  ('boracay',
   'Boracay',
   'Western Visayas',
   'White Beach, Yapak walls and the Ariel Point cliff jumps. Watersports row at Station 3 plus all-day island hops to Crystal Cove.',
   '/media/island-tour.jpg',
   3)
on conflict (slug) do update
  set name        = excluded.name,
      region      = excluded.region,
      description = excluded.description,
      hero_image  = excluded.hero_image,
      sort_order  = excluded.sort_order;
