#!/usr/bin/env node
/**
 * Pre-seed family-friendly restaurants for popular destinations.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-restaurants.mjs
 *   node --env-file=.env.local scripts/seed-restaurants.mjs orlando     ← seed matching destinations only
 *   node --env-file=.env.local scripts/seed-restaurants.mjs --intl      ← seed international only
 *   node --env-file=.env.local scripts/seed-restaurants.mjs --cities    ← seed US cities only
 *
 * Once the DB is populated, generate-restaurants/route.js returns results
 * instantly from cache instead of calling Claude on every user request.
 *
 * Model: claude-sonnet-4-6
 * Cost:  ~$0.08–0.12 per destination  ·  ~$8–12 for full seed run
 * Time:  ~15–20 min for all ~105 destinations (2s delay between calls)
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ── Env check ────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY     = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL          = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌  Missing env vars. Run with:");
  console.error("    node --env-file=.env.local scripts/seed-restaurants.mjs");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase  = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// ── Destination list (cities only — national parks don't need restaurants) ────
const DESTINATIONS = [
  // US Metropolises
  { city: "New York City",    state: "NY", country: "US", type: "city" },
  { city: "Los Angeles",      state: "CA", country: "US", type: "city" },
  { city: "Chicago",          state: "IL", country: "US", type: "city" },
  { city: "San Francisco",    state: "CA", country: "US", type: "city" },
  { city: "Boston",           state: "MA", country: "US", type: "city" },
  { city: "Washington",       state: "DC", country: "US", type: "city" },

  // Florida & Theme Parks
  { city: "Orlando",          state: "FL", country: "US", type: "city" },
  { city: "Miami",            state: "FL", country: "US", type: "city" },
  { city: "Fort Lauderdale",  state: "FL", country: "US", type: "city" },
  { city: "Tampa",            state: "FL", country: "US", type: "city" },
  { city: "Key West",         state: "FL", country: "US", type: "city" },

  // Sun Belt & Southwest
  { city: "Las Vegas",        state: "NV", country: "US", type: "city" },
  { city: "Phoenix",          state: "AZ", country: "US", type: "city" },
  { city: "Sedona",           state: "AZ", country: "US", type: "city" },
  { city: "Santa Fe",         state: "NM", country: "US", type: "city" },
  { city: "Albuquerque",      state: "NM", country: "US", type: "city" },

  // Southern Charm & Music Cities
  { city: "New Orleans",      state: "LA", country: "US", type: "city" },
  { city: "Nashville",        state: "TN", country: "US", type: "city" },
  { city: "Memphis",          state: "TN", country: "US", type: "city" },
  { city: "Charleston",       state: "SC", country: "US", type: "city" },
  { city: "Savannah",         state: "GA", country: "US", type: "city" },
  { city: "Asheville",        state: "NC", country: "US", type: "city" },

  // West Coast Classics
  { city: "San Diego",        state: "CA", country: "US", type: "city" },
  { city: "Seattle",          state: "WA", country: "US", type: "city" },
  { city: "Portland",         state: "OR", country: "US", type: "city" },
  { city: "Palm Springs",     state: "CA", country: "US", type: "city" },
  { city: "Monterey",         state: "CA", country: "US", type: "city" },

  // Texas Cities
  { city: "Austin",           state: "TX", country: "US", type: "city" },
  { city: "San Antonio",      state: "TX", country: "US", type: "city" },
  { city: "Dallas",           state: "TX", country: "US", type: "city" },
  { city: "Houston",          state: "TX", country: "US", type: "city" },

  // Nature & Scenic Hubs
  { city: "Honolulu",         state: "HI", country: "US", type: "city" },
  { city: "Maui",             state: "HI", country: "US", type: "city" },
  { city: "Jackson Hole",     state: "WY", country: "US", type: "city" },
  { city: "West Yellowstone", state: "MT", country: "US", type: "city" },
  { city: "Anchorage",        state: "AK", country: "US", type: "city" },

  // Mountain & Cultural
  { city: "Denver",           state: "CO", country: "US", type: "city" },
  { city: "Salt Lake City",   state: "UT", country: "US", type: "city" },
  { city: "Aspen",            state: "CO", country: "US", type: "city" },
  { city: "Taos",             state: "NM", country: "US", type: "city" },

  // Midwest & Northeast Gems
  { city: "St. Louis",        state: "MO", country: "US", type: "city" },
  { city: "Philadelphia",     state: "PA", country: "US", type: "city" },
  { city: "Baltimore",        state: "MD", country: "US", type: "city" },
  { city: "Pittsburgh",       state: "PA", country: "US", type: "city" },
  { city: "Minneapolis",      state: "MN", country: "US", type: "city" },

  // Unique Spots
  { city: "Provincetown",     state: "MA", country: "US", type: "city" },
  { city: "Brooklyn",         state: "NY", country: "US", type: "city" },

  // ── European Cities ──────────────────────────────────────────────────
  { city: "Rome",             state: null, country: "IT", type: "international" },
  { city: "Paris",            state: null, country: "FR", type: "international" },
  { city: "London",           state: null, country: "GB", type: "international" },
  { city: "Barcelona",        state: null, country: "ES", type: "international" },
  { city: "Florence",         state: null, country: "IT", type: "international" },
  { city: "Bern",             state: null, country: "CH", type: "international" },
  { city: "Berlin",           state: null, country: "DE", type: "international" },
  { city: "Frankfurt",        state: null, country: "DE", type: "international" },
  { city: "Aix-en-Provence",  state: null, country: "FR", type: "international" },
  { city: "Lisbon",           state: null, country: "PT", type: "international" },
  { city: "Athens",           state: null, country: "GR", type: "international" },
  { city: "Venice",           state: null, country: "IT", type: "international" },
  { city: "Monaco",           state: null, country: "MC", type: "international" },
  { city: "Vienna",           state: null, country: "AT", type: "international" },
  { city: "Prague",           state: null, country: "CZ", type: "international" },
  { city: "Munich",           state: null, country: "DE", type: "international" },
  { city: "Dublin",           state: null, country: "IE", type: "international" },
  { city: "Belfast",          state: null, country: "GB", type: "international" },
  { city: "Edinburgh",        state: null, country: "GB", type: "international" },
  { city: "Inverness",        state: null, country: "GB", type: "international" },
  { city: "Budapest",         state: null, country: "HU", type: "international" },
  { city: "Copenhagen",       state: null, country: "DK", type: "international" },
  { city: "Oslo",             state: null, country: "NO", type: "international" },
  { city: "Stockholm",        state: null, country: "SE", type: "international" },

  // ── Asia ─────────────────────────────────────────────────────────────
  { city: "Tokyo",            state: null, country: "JP", type: "international" },
  { city: "Singapore",        state: null, country: "SG", type: "international" },
  { city: "Bangkok",          state: null, country: "TH", type: "international" },
  { city: "Hanoi",            state: null, country: "VN", type: "international" },
  { city: "Hong Kong",        state: null, country: "HK", type: "international" },

  // ── Oceania ──────────────────────────────────────────────────────────
  { city: "Sydney",           state: null, country: "AU", type: "international" },
  { city: "Melbourne",        state: null, country: "AU", type: "international" },
  { city: "Wellington",       state: null, country: "NZ", type: "international" },
  { city: "Christchurch",     state: null, country: "NZ", type: "international" },
];

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert family travel planner specializing in finding kid-friendly restaurants for families with young children (ages 0-12).

Generate exactly 14 real, family-friendly restaurants for the destination provided.

CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences. Start with [ and end with ].

Each restaurant object MUST include ALL of these fields:
{
  "id": "snake_case_unique_id",
  "name": "Official restaurant name",
  "cuisine": "american" | "mexican" | "asian" | "italian" | "seafood" | "pizza" | "bbq" | "mediterranean" | "southern" | "brunch" | "cafe" | "other",
  "meal_type": "lunch" | "dinner" | "both",
  "price_range": "$" | "$$" | "$$$",
  "avg_meal_usd": <number: average cost per person>,
  "hours": "<human readable hours, e.g. Mon-Sat 11am-9pm>",
  "notes": "<2-3 practical tips for parents: highchairs, noise level, kid menu, wait times, best time to go with kids>",
  "location": "<full street address>",
  "kid_menu": true | false,
  "highchairs": true | false,
  "changing_tables": true | false,
  "outdoor_seating": true | false,
  "stroller_friendly": true | false,
  "noise_level": "quiet" | "moderate" | "loud",
  "wait_time_typical": "<e.g. 10-15 min, no wait, 30+ min on weekends>",
  "reservation_recommended": true | false,
  "duration_mins": <number: typical meal duration for families, usually 45-90>,
  "affiliate": "<real website or Google Maps URL>"
}

SELECTION RULES:
- Real restaurants only (must actually exist at this location)
- Mix of cuisine types
- At least 4 restaurants must have kid menus
- At least 3 budget-friendly options ($ or $$)
- Include a mix of lunch-only, dinner-only, and both
- At least 3 with outdoor seating (toddlers can be noisy)
- Practical notes focused on what parents with young kids actually need
- Include popular local favorites, not just chains
- Prefer restaurants near popular tourist/activity areas`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRestaurants(text) {
  const start = text.indexOf("[");
  const end   = text.lastIndexOf("]");

  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* fall through */ }
  }
  if (start !== -1) {
    const lastBrace = text.lastIndexOf("}");
    if (lastBrace > start) {
      try { return JSON.parse(text.slice(start, lastBrace + 1) + "]"); } catch { /* fall through */ }
    }
  }
  throw new Error("Could not parse JSON from response");
}

// ── Core seeding function ─────────────────────────────────────────────────────

async function seedDestination(dest) {
  const { city, state, country } = dest;
  const citySlug = toSlug(city);

  const location = state ? `${city}, ${state}` : `${city}, ${country}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `Generate 14 family-friendly restaurants for: ${location}. Return ONLY a JSON array.`,
    }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const restaurants = parseRestaurants(text);

  if (!Array.isArray(restaurants) || restaurants.length < 5) {
    throw new Error(`Only got ${restaurants?.length ?? 0} restaurants — too few, skipping`);
  }

  // Delete existing pre-seeded restaurants for this destination
  let del = supabase
    .from("restaurants")
    .delete()
    .ilike("destination_city", city)
    .eq("source", "pre_seeded");
  if (state) del = del.ilike("destination_state", state);
  const { error: delError } = await del;
  if (delError) throw new Error(`Delete failed: ${delError.message}`);

  const rows = restaurants.map((r) => ({
    external_id:              `${citySlug}_${toSlug(r.id ?? r.name)}`,
    name:                     r.name,
    cuisine:                  r.cuisine ?? "other",
    meal_type:                r.meal_type ?? "both",
    price_range:              r.price_range ?? "$$",
    avg_meal_usd:             r.avg_meal_usd ?? null,
    hours:                    r.hours ?? null,
    notes:                    r.notes ?? null,
    location:                 r.location ?? null,
    kid_menu:                 r.kid_menu ?? false,
    highchairs:               r.highchairs ?? false,
    changing_tables:           r.changing_tables ?? false,
    outdoor_seating:          r.outdoor_seating ?? false,
    stroller_friendly:        r.stroller_friendly ?? true,
    noise_level:              r.noise_level ?? "moderate",
    wait_time_typical:        r.wait_time_typical ?? null,
    reservation_recommended:  r.reservation_recommended ?? false,
    duration_mins:            r.duration_mins ?? 60,
    affiliate:                r.affiliate ?? null,
    destination_city:         city,
    destination_state:        state ?? null,
    destination_country:      country,
    source:                   "pre_seeded",
    updated_at:               new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from("restaurants").insert(rows);
  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

  return rows.length;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2] ?? "";

  let targets;
  if (arg === "--intl") {
    targets = DESTINATIONS.filter((d) => d.type === "international");
  } else if (arg === "--cities") {
    targets = DESTINATIONS.filter((d) => d.type === "city");
  } else if (arg && !arg.startsWith("--")) {
    const filter = arg.toLowerCase();
    targets = DESTINATIONS.filter((d) => d.city.toLowerCase().includes(filter));
    if (!targets.length) {
      console.error(`No destinations match "${arg}"`);
      process.exit(1);
    }
  } else {
    targets = DESTINATIONS;
  }

  console.log(`\n🍽️  Seeding ${targets.length} destinations (claude-sonnet-4-6, 14 restaurants each)\n`);
  console.log(`    Estimated time: ${Math.round(targets.length * 10 / 60)} min`);
  console.log(`    Estimated cost: ~$${(targets.length * 0.10).toFixed(0)}\n`);
  console.log("─".repeat(60));

  let succeeded = 0, failed = 0;
  const failures = [];

  for (const dest of targets) {
    const label = dest.state ? `${dest.city}, ${dest.state}` : `${dest.city}, ${dest.country}`;
    const num   = `[${succeeded + failed + 1}/${targets.length}]`;
    process.stdout.write(`  ${num} ${label}... `);

    let lastError;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const count = await seedDestination(dest);
        console.log(`✓  ${count} restaurants${attempt > 1 ? ` (retry ${attempt - 1})` : ""}`);
        succeeded++;
        lastError = null;
        break;
      } catch (e) {
        lastError = e;
        if (attempt < 2) {
          process.stdout.write(`  ↻ retrying... `);
          await sleep(3000);
        }
      }
    }
    if (lastError) {
      console.log(`✗  ${lastError.message}`);
      failed++;
      failures.push({ label, error: lastError.message });
    }

    // 2s between calls to stay within rate limits
    if (succeeded + failed < targets.length) await sleep(2000);
  }

  console.log("\n" + "─".repeat(60));
  console.log(`\n✅  Done!  ${succeeded} succeeded · ${failed} failed\n`);

  if (failures.length) {
    console.log("Failed destinations:");
    failures.forEach((f) => console.log(`  ✗ ${f.label} — ${f.error}`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
