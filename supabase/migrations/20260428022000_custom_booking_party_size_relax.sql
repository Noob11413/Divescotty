-- Relax party_size cap for custom bookings and conversions.
-- Custom requests can include larger groups (school outings, corporate retreats,
-- charters). The public activity booking form still validates against the
-- tighter 2–20 range in application code, but the database now permits up to
-- 100 so admin conversions and manual entries work.

alter table public.custom_booking_requests
  drop constraint if exists custom_booking_requests_party_size_check;

alter table public.custom_booking_requests
  add constraint custom_booking_requests_party_size_check
    check (party_size >= 1 and party_size <= 100);

alter table public.bookings
  drop constraint if exists bookings_party_check;

alter table public.bookings
  add constraint bookings_party_check
    check (party_size >= 2 and party_size <= 100);
