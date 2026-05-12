-- Align party size with app rules: 2–20 guests per booking / custom request / activity offer.

update public.bookings
set party_size = 2
where party_size < 2;

update public.bookings
set party_size = 20
where party_size > 20;

alter table public.bookings
  drop constraint if exists bookings_party_check;

alter table public.bookings
  add constraint bookings_party_check check (party_size >= 2 and party_size <= 20);

update public.custom_booking_requests
set party_size = 2
where party_size < 2;

update public.custom_booking_requests
set party_size = 20
where party_size > 20;

alter table public.custom_booking_requests
  drop constraint if exists custom_booking_requests_party_size_check;

alter table public.custom_booking_requests
  add constraint custom_booking_requests_party_size_check check (party_size >= 2 and party_size <= 20);

update public.activities
set min_party = greatest(2, least(min_party, 20));

update public.activities
set max_party = least(20, greatest(max_party, min_party));

alter table public.activities
  drop constraint if exists activities_party_check;

alter table public.activities
  add constraint activities_party_check check (
    min_party >= 2 and max_party <= 20 and max_party >= min_party
  );
