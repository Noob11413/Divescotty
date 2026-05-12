alter table public.employees
  add column if not exists payout_mode text not null default 'percent'
    check (payout_mode in ('percent', 'hourly')),
  add column if not exists payout_percent numeric(5,2) not null default 30
    check (payout_percent >= 0 and payout_percent <= 100),
  add column if not exists hourly_rate_cents integer null
    check (hourly_rate_cents is null or hourly_rate_cents >= 0),
  add column if not exists overtime_hourly_rate_cents integer null
    check (overtime_hourly_rate_cents is null or overtime_hourly_rate_cents >= 0);

alter table public.bookings
  add column if not exists quoted_total_cents integer not null default 0
    check (quoted_total_cents >= 0),
  add column if not exists quoted_currency text not null default 'PHP',
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  add column if not exists amount_paid_cents integer not null default 0
    check (amount_paid_cents >= 0),
  add column if not exists payment_method_mock text null,
  add column if not exists paid_at timestamptz null,
  add column if not exists fuel_cost_cents integer not null default 0
    check (fuel_cost_cents >= 0),
  add column if not exists tank_cost_cents integer not null default 0
    check (tank_cost_cents >= 0),
  add column if not exists gear_cost_cents integer not null default 0
    check (gear_cost_cents >= 0),
  add column if not exists other_cost_cents integer not null default 0
    check (other_cost_cents >= 0),
  add column if not exists instructor_hours numeric(6,2) not null default 0
    check (instructor_hours >= 0),
  add column if not exists instructor_payout_cents integer not null default 0
    check (instructor_payout_cents >= 0),
  add column if not exists total_cost_cents integer not null default 0
    check (total_cost_cents >= 0),
  add column if not exists estimated_profit_cents integer not null default 0;

create index if not exists bookings_payment_status_idx on public.bookings(payment_status);
