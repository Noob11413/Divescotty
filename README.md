# DiveScotty

Next.js + Supabase app for Scotty's Action Sports Network.

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm
- A Supabase project

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose publicly)

## 3) Apply database schema

If Supabase CLI is not ready on your machine, use the dashboard SQL editor:

1. Open `supabase/migrations/20260427000001_init.sql`
2. Copy all SQL
3. Paste into Supabase SQL Editor
4. Run the script

This creates required tables/functions including `public.profiles` and `public.promote_to_admin(text)`.

Then apply these follow-up migrations:

- `supabase/migrations/20260427163000_add_tour_guides.sql`
- `supabase/migrations/20260427171000_employees_model.sql`

The latest model uses `employees` (role enum + photo/phone/email) for booking assignment.

## 4) Create first admin

1. Create a user in Supabase Auth (or sign up once through the app)
2. Run in SQL Editor:

```sql
select public.promote_to_admin('admin@example.com');
```

3. Sign out and sign in again so the session gets refreshed claims.

## 5) Run locally

```bash
npm run dev
```

Open:

- Site: `http://localhost:3000`
- Admin login: `http://localhost:3000/login`
- Admin area: `http://localhost:3000/admin`

## Useful scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm start` - start production server (requires build first)
- `npm run lint` - run lint checks
- `npm run types` - run TypeScript checks

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Rotate any password or key shared in chat/screenshots.
- Keep admin accounts limited and use strong passwords.
