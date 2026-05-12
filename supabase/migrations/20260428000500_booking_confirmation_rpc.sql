create or replace function public.get_booking_confirmation_by_reference(
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
  location_name text
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
    b.preferred_time,
    b.special_requests,
    a.name as activity_name,
    l.name as location_name
  from public.bookings b
  left join public.activities a on a.id = b.activity_id
  left join public.locations l on l.id = b.location_id
  where b.reference = p_reference
  limit 1;
end;
$$;

revoke all on function public.get_booking_confirmation_by_reference(text) from public;
grant execute on function public.get_booking_confirmation_by_reference(text) to anon, authenticated;
