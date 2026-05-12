update public.bookings b
set
  quoted_total_cents = greatest(0, b.party_size * coalesce(a.price_cents, 0)),
  quoted_currency = 'PHP',
  total_cost_cents = greatest(
    0,
    coalesce(b.fuel_cost_cents, 0) +
    coalesce(b.tank_cost_cents, 0) +
    coalesce(b.gear_cost_cents, 0) +
    coalesce(b.other_cost_cents, 0) +
    coalesce(b.instructor_payout_cents, 0)
  ),
  estimated_profit_cents = greatest(0, b.party_size * coalesce(a.price_cents, 0)) - greatest(
    0,
    coalesce(b.fuel_cost_cents, 0) +
    coalesce(b.tank_cost_cents, 0) +
    coalesce(b.gear_cost_cents, 0) +
    coalesce(b.other_cost_cents, 0) +
    coalesce(b.instructor_payout_cents, 0)
  )
from public.activities a
where a.id = b.activity_id;
