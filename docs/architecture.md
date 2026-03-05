# Family Travel Planner — Architecture Document
*Last updated: 2026-03-03*

## Product Vision
A nap-aware, age-smart family travel planner. Two target profiles:
1. **City Explorer Family** — major attractions, theme parks, museums, hotel-based
2. **Outdoor Adventure Family** *(niche, Phase 5)* — national parks, hiking, camping

## Three Core Pillars
1. **Robust scalable data structure** — Supabase Postgres, JSONB for flexibility
2. **Genius AI activity engine** — two-phase: generate+cache, then score+schedule
3. **Fully usable scheduling UI** — weekly calendar grid (like Google Calendar)

---

## Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Modern standard, SSR + API routes in one |
| UI | React 18 + inline styles | From prototype; migrate to Tailwind later |
| AI | @anthropic-ai/sdk (claude-sonnet-4-6) | Core differentiator |
| Database | Supabase (Postgres) | Auth + DB + RLS in one service |
| Hosting | Vercel | Auto-deploy from GitHub |
| Package mgr | npm | Already in use |

---

## Database Schema

### Key Design Decisions
- `birth_date` not `age` on children — age calculated dynamically, historical data preserved
- `duration_category` on activities — the key to genius scheduling (full_day / half_day / 2-4h / 1-2h / under_1h)
- `niche` column on activities (nullable) — extensible for outdoor niche: null = general, 'outdoor', etc.
- Activity cache — AI-generated activities stored in DB, refreshed every 30-90 days, reused across users
- `share_token` (UUID) on trips — enables shareable read-only links without auth
- Row Level Security (RLS) on all user tables — data isolation at DB level

### Entity Relationships
```
auth.users (Supabase managed)
└── family_profiles (1:1)
    ├── children (1:many)
    └── nap_schedules (1:many)

trips (user_id → auth.users)
├── trip_days (1:many)
│   └── schedule_blocks (1:many) ← FK to activities (optional)
└── packing_lists (1:1)

activities (shared, all users read)
└── activity_age_suitability (1:many)

activity_ratings (user_id + activity_id + trip_id)
```

---

## AI Activity Engine — Two-Phase Architecture

### Phase A: Generate & Cache
1. Check DB for cached activities matching `destination_city` + `destination_state`
2. If cache hit and fresh (< 30 days old): return from DB
3. If cache miss or stale: call Claude API with destination + family context
4. Store results in `activities` table
5. (Future) Enrich with Google Places / TripAdvisor ratings

### Phase B: Score & Schedule
1. Filter activities by: kids' age ranges, preferences, niche
2. Score by: family ratings history, preference match, age suitability
3. Schedule intelligently using `duration_category`:
   - `full_day` → consumes entire free day
   - `half_day` → AM or PM block
   - `2-4h` → fits one free window
   - `1-2h` → buffer activity or before/after nap
   - `under_1h` → filler between activities
4. Respect nap windows, wake/bed times, travel buffer between activities

### Claude Prompt Strategy
- System prompt includes full duration category logic and scheduling rules
- User message includes: destination, kids ages (from birth_date), preferences, trip length, nap schedule
- Output: structured JSON with `duration_category` on every activity

---

## Scheduling UI — Weekly Calendar Grid

### Visual Model
- Days as columns, time as rows (Google Calendar metaphor)
- Block height proportional to duration
- Nap blocks: fixed, styled differently (can't drag)
- Activity blocks: draggable (day-to-day, time-to-time)
- Free slots: click to add custom block
- Sidebar: unplaced activities (drag onto calendar)

### Interactions
- Drag from sidebar → drop on calendar slot
- Drag block → reorder within day or move to different day
- Click empty slot → modal to add custom block (name, type, time, location, notes)
- X button on block → removes it, returns to sidebar

### Future: Google Calendar Integration
- OAuth → import existing calendar events as blocks
- "My week" mode for local weekly scheduling (not just vacation trips)

---

## Build Phases

| Phase | What | Key Deliverables |
|---|---|---|
| 1 | **Data Foundation** | Supabase schema, auth (email + Google OAuth), save/load trips |
| 2 | **AI Engine Upgrade** | Two-phase generate+schedule, activity DB cache, smarter prompts |
| 3 | **Calendar UI** | Weekly grid, custom blocks, Google Calendar import |
| 4 | **Packing Lists** | AI-generated checklists, affiliate links (Amazon/REI) |
| 5 | **Outdoor Niche** | AllTrails integration, weather, gear, national park data |

---

## Monetization Roadmap
1. **Affiliates** (zero friction, works at low traffic): BabyQuip, Amazon gear, Viator activities
2. **Freemium SaaS** ($5-8/mo or $50/yr): unlimited saved trips, premium features, no ads
3. **B2B** (later): travel agencies, hotel concierge tools, resort packages

## Growth Strategy
- Shareable trip links → viral loop
- SEO landing pages per destination ("best San Diego activities for toddlers")
- Email list from day one
- Instagram/TikTok showing tool in use
- Facebook group for outdoor niche community
