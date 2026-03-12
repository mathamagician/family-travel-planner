# Toddler Trip (Family Travel Planner) — Project Instructions

## Project Identity
- **Toddler Trip** — Family travel itinerary planner for parents with young kids (0–12)
- Builds day-by-day schedules around nap times, kids' ages, and activity durations
- Live at: https://www.toddlertrip.com
- Monetization: affiliate links (Viator, BabyQuip, Amazon), eventually freemium SaaS

## Tech Stack
- Framework: Next.js 15 (App Router), React 18, JavaScript (not TypeScript yet)
- Styling: inline styles (from prototype era) — NOT Tailwind yet
- AI: @anthropic-ai/sdk (claude-sonnet-4-6) for activity generation and packing lists
- Database/Auth: Supabase (Postgres + Auth with Google OAuth + email/password)
- Hosting: Vercel (CLI workflow, not GitHub auto-deploy)
- Fonts: Playfair Display + Nunito (Google Fonts)

## Modular Architecture (Phase 6 — implemented)
```
components/
├── shared/
│   ├── config.js                     ← Single source of truth: TYPE_CONFIG, ENERGY, prefs, CSS
│   └── utils.js                      ← Shared helpers: time, date, formatting
├── modules/
│   ├── family/
│   │   └── FamilyModule.jsx          ← Module 1: Family profile UI
│   ├── activities/
│   │   ├── ActivitiesAgent.js        ← Module 2A: Fetch/score/sort activities
│   │   └── ActivitiesModule.jsx      ← Module 2B: Activity cards + selection UI
│   ├── schedule/
│   │   └── PlanningAgent.js          ← Module 3A: Duration-aware itinerary generator
│   └── packing/
│       ├── PackingAgent.js           ← Module 4A: Packing list data fetch
│       └── PackingModule.jsx         ← Module 4B: Packing checklist UI
├── FamilyTravelPlanner.jsx           ← Thin orchestrator (state + step navigation)
├── WeeklyCalendar.jsx                ← Module 3B: Standalone reusable calendar (plug-in ready)
├── AuthModal.jsx                     ← Email/password + Google OAuth modal
├── UserMenu.jsx                      ← Header auth state + sign out
├── SaveTripButton.jsx                ← Save + share trip
├── MyTripsPanel.jsx                  ← Load saved trips
└── Providers.jsx                     ← Supabase auth context
```

### Module Boundaries
- **Agents** (2A, 3A, 4A) = pure functions / async fetchers. No React state.
- **Modules** (1, 2B, 3B, 4B) = React UI components. Receive data via props.
- **WeeklyCalendar** (Module 3B) = designed as standalone reusable. Zero ToddlerTrip-specific dependencies. Could be extracted as a plug-in for other projects.
- **Orchestrator** = thin shell. Only manages step navigation and top-level state.

## Supabase Schema (key tables)
- `family_profiles` — one per user (preferences, adults count, home location)
- `children` — multiple per family, stores `birth_date` (age calculated dynamically, never stored)
- `nap_schedules` — per family (start time, duration, label)
- `activities` — shared cache, 40+ per destination, AI-generated with `duration_category`
- `activity_age_suitability` — per-age-group suitability matrix
- `trips` — destination, dates, status, profile_snapshot, activities_snapshot
- `trip_days` / `schedule_blocks` — per-day and per-block scheduling data
- `packing_lists` — items with packed status and affiliate URLs
- `activity_ratings` — user feedback for AI learning loop
- RLS enabled on all user tables; activities are world-readable

## Architecture Decisions (locked in)
- `birth_date` not `age` for children — age calculated dynamically
- `duration_category` on activities: full_day | half_day | 2-4h | 1-2h | <1h — drives scheduling
- `niche` column on activities (nullable): null = general, 'outdoor' = outdoor niche
- Two-phase AI engine: Phase A = generate & cache to DB; Phase B = score & schedule
- Activities cached 30 days minimum, refreshed via biweekly Vercel cron
- Share token (UUID) on trips for public read-only links

## Third-Party Integrations
- **Viator**: affiliate booking links (PID: env var `NEXT_PUBLIC_VIATOR_PID`)
- **BabyQuip**: gear rental affiliate (env var `NEXT_PUBLIC_BABYQUIP_URL`)
- **Amazon Associates**: packing list affiliate (env var `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG`)
- **Open-Meteo**: free weather API, no key required (geocoding + forecast)
- **TripAdvisor**: planned for Phase 7 (reviews, ratings, sentiment)

## Environment Variables
Required:
- `ANTHROPIC_API_KEY` — Claude API
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public auth key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only admin key (never expose to browser)
- `INTERNAL_API_SECRET` — protects seed endpoint

Optional (affiliate):
- `NEXT_PUBLIC_VIATOR_PID`, `NEXT_PUBLIC_BABYQUIP_URL`, `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG`

Vercel cron:
- `CRON_SECRET` — biweekly activity refresh job auth

## Deployment Workflow
IMPORTANT: Always deploy to staging first, then production. Never skip staging.

1. Make and test changes locally on `main` branch
2. Commit and push to main
3. Deploy staging:
   ```
   git checkout staging && git merge main --ff-only && git push origin staging
   vercel --yes
   vercel alias set <preview-url> toddlertrip-staging.vercel.app
   git checkout main
   ```
4. Compare staging (toddlertrip-staging.vercel.app/plan) vs production (toddlertrip.com/plan)
5. Once approved: `vercel --prod --yes`

## Build Phases — Roadmap
- Phase 1 ✅ Supabase schema + auth + save/load trips
- Phase 2 ✅ AI engine (duration_category scheduler, DB caching)
- Phase 3 ✅ Weekly calendar grid UI (drag/drop, custom blocks)
- Phase 4 ✅ Packing/gear list (AI generation, affiliate links)
- Phase 4.5 ✅ Pre-seeded activity cache, ShareBar, packing persistence
- Phase 6 ✅ Modularization (agents + modules architecture)
- Phase 7 🔜 Module improvements (TripAdvisor, energy scheduling, mobile schedule, PDF export)
- Phase 8 🔜 Mobile optimization (full review across all modules)
- Phase 9 🔜 Analytics & SEO (Google Analytics, marketing strategy)
- Phase 10 🔜 Restaurant module (Module RA + RB)
- Phase 11 🔜 Outdoor niche (AllTrails, national parks, hiking)
- Phase 12 🔜 iPhone app (Xcode)

## Seed Script
```
node --env-file=.env.local scripts/seed-activities.mjs
node --env-file=.env.local scripts/seed-activities.mjs "new york"
```
Flags: --parks, --cities, --intl. 40 activities per destination.

## Team
- Eddie (mathamagician) — product/vision, Chief Actuary
- Delan (delankai) — collaborator/developer, push access
- Matt — outdoor niche domain expert (advisory, not on repo)
