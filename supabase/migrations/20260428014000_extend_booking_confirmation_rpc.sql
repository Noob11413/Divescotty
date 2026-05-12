-- Expose status / payment / quote on the public confirmation RPC so the
-- marketing confirmation page can reflect admin updates without SERVICE_ROLE.
-- PG cannot change OUT row type with CREATE OR REPLACE; drop first.

drop function if exists public.get_booking_confirmation_by_reference(text);

create function public.get_booking_confirmation_by_reference(
  p_reference text
)
returns table (
  reference text,
  customer_name text,
  customer_email text,
  customer_phone text,
  party_size integer,
  preferred_date date,
  preferred_time text,
  special_requests text,
  activity_name text,
  location_name text,
  status public.booking_status,
  payment_status text,
  quoted_total_cents integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    b.reference,
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.party_size,
    b.preferred_date,
    case when b.preferred_time is null then null else b.preferred_time::text end,
    b.special_requests,
    a.name as activity_name,
    l.name as location_name,
    b.status,
    b.payment_status,
    b.quoted_total_cents
  from public.bookings b
  left join public.activities a on a.id = b.activity_id
  left join public.locations l on l.id = b.location_id
  where b.reference = p_reference
  limit 1;
end;
$$;

revoke all on function public.get_booking_confirmation_by_reference(text) from public;
grant execute on function public.get_booking_confirmation_by_reference(text) to anon, authenticated;
