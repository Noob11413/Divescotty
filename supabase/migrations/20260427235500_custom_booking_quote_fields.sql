alter table public.custom_booking_requests
  add column if not exists quote_amount_cents integer null check (quote_amount_cents >= 0),
  add column if not exists quote_currency text not null default 'PHP',
  add column if not exists quote_expires_on date null;
