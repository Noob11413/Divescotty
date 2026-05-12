# DiveScotty — engineering handoff (external / senior review)

**Purpose:** Give a senior engineer (e.g. IBM) enough context to **review architecture, security, and gaps** without guessing what shipped.  
**Audience:** Staff who will read code + Supabase migrations, not marketing copy.

**Process note:** Parts of this codebase were built with **AI-assisted editing** (Cursor). The owner is responsible for **requirements, integration, and verifying behavior** before review. Ask for a **live walkthrough** of one vertical (e.g. booking create → DB) if authorship clarity matters.

---

## 1. Product snapshot

| Surface | Role |
|---------|------|
| **Marketing** | Category pillars (`/[slug]`), activity detail (`/activities/[category]/[slug]`), locations, contact, booking confirmation + PDF routes. |
| **Admin** | Bookings list + row editor, calendar, custom booking pipeline, activities/categories/**subcategories**, cost templates, employees, settings. |
| **Data** | Supabase Postgres + RLS; server actions for mutations; RPCs for some reads (e.g. booking confirmation by reference). |

---

## 2. Implemented areas (verify in tree)

These paths are the main **session-related** deliverables; confirm against your branch.

### Admin pagination

- **Component:** `src/components/admin/AdminPagination.tsx` — First / Prev / page / Next / Last; preserves query params.  
- **Pages:** `src/app/admin/bookings/page.tsx`, `src/app/admin/custom-bookings/page.tsx` — `count: "exact"` + `.range()`, clamped page, list size constant `ADMIN_LIST_PAGE_SIZE` (exported from pagination module).  
- **UX:** Bookings filter form includes hidden `page=1` so new filters reset pagination.

### Marketing: subcategories (navigation + category pillar)

- **Queries:** `src/lib/queries.ts` — `getSubcategoriesForNav()`, `getSubcategoriesByCategoryId()`, activity selects include embedded `subcategory` (soft-deleted subcategories stripped in mapper), ordering helper for catalog lists.  
- **Layout:** `src/app/(marketing)/layout.tsx` — Loads subcategories grouped by `category_id` for nav props.  
- **Navbar:** `src/components/site/Navbar.tsx` — Categories with subcategories get hover/focus dropdown linking to `/{slug}#category-activities` and `/{slug}#cat-sub-{subSlug}`.  
- **Burger menu:** `src/components/site/MenuOverlay.tsx` — Per-pillar “Browse” links (same hash scheme).  
- **Category landing:** `src/components/site/CategoryLanding.tsx` — Subcategory chips, sections per subcategory (with empty copy), “More experiences” for activities without a matching subcategory slug; `id`s for scroll targets.  
- **Cards / detail:** `src/components/site/ActivityCard.tsx` (optional `subcategoryName`), `src/app/(marketing)/activities/[category]/[slug]/page.tsx` (eyebrow includes subcategory when set), homepage + locations pages pass subcategory label where applicable.

### Database (subcategories)

- **Migration:** `supabase/migrations/20260427230000_subcategories.sql` — `subcategories` table, `activities.subcategory_id`, RLS policies.  
- **Types:** `src/lib/supabase/database.types.ts` — Regenerate when schema changes (`subcategories` includes `description`, no `hero_image` column at time of this doc unless added later).

---

## 3. Planning artifacts (product / IA, not all implemented)

Internal Cursor plan (path may vary on machine):

- `nested_subcategory_strategy` — Legacy site vs schema; **Option A/B/C** (hub routes vs in-page TOC vs third catalog tier); **category-level Book + service picker** simplification; **subcategory hero imagery** (static `public/` convention vs DB URL vs Supabase Storage); recommendation to **avoid large images inside Postgres** long-term.

---

## 4. Senior review checklist (recommended focus)

### Security & access

- **RLS:** Policies on `bookings`, `activities`, `categories`, `subcategories`, `custom_booking_requests`, storage (if added). Confirm admin-only writes and public read rules match intent.  
- **Admin routes:** `src/middleware.ts` (or equivalent) — how unauthenticated users are blocked from `/admin`.  
- **Auth:** `src/app/actions/auth.ts`, `src/app/login/*` — session handling, password flow, any `service_role` usage (avoid exposing in client).

### Data & performance

- **Hero images:** `getHeroImageValue` in `src/app/actions/activities.ts` currently stores uploads as **`data:...;base64,...` strings** in DB for category/location heroes — convenient for MVP but **grows database size**; consider **Supabase Storage + public URL** (and optional migration of existing rows).  
- **Pagination:** Confirm count queries stay indexed; filter combinations on bookings list.  
- **PostgREST embeds:** Activity `subcategory:subcategories(...)` — verify in staging that embed resolves (FK from `activities.subcategory_id`).

### Correctness & ops

- **Booking lifecycle:** Status transitions, cancelled bookings, payment gating for PDFs — trace one path in code + RPCs under `supabase/migrations/`.  
- **Custom bookings:** Actions under `src/app/actions/custom-bookings.ts` and admin UI.

### Quality

- **Automated tests:** If absent or thin, call that out as **known gap** for production hardening.  
- **CI:** Lint/typecheck on PR if not already wired.

---

## 5. Suggested junior follow-ups (optional backlog)

| ID | Task | Notes |
|----|------|--------|
| T1 | Pure helper `subcategoryHeroSrc(categorySlug, subSlug, fallback?)` | Convention: `/media/subcategories/{category}-{sub}.webp`; document fallback. |
| T2 | One-page **booking flow outline** (tables + server actions) | Self-doc for onboarding. |
| T3 | Migration `subcategories.hero_image` + admin URL field | If marketing needs editable art without deploy. |
| T4 | Category landing **hero strip** per subcategory | Uses T1 or T3 for `src`. |

---

## 6. Local verification commands (for reviewer)

```bash
npm install
npm run lint
npm run build
```

Supabase (if local):

```bash
npx supabase db reset   # destructive; loads migrations + seed
```

*(This workspace may not have `.git` initialized in all environments; if git is available, reviewer can run `git log --oneline` for commit narrative.)*

---

## 7. Contact / walkthrough

Owner can offer a **30–45 min screenshare**: marketing category page → activity booking → admin booking row → one migration/RPC of reviewer’s choice.
