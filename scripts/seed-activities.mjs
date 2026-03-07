#!/usr/bin/env node
/**
 * Pre-seed family-friendly activities for popular destinations.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-activities.mjs
 *   node --env-file=.env.local scripts/seed-activities.mjs orlando     ← seed matching destinations only
 *   node --env-file=.env.local scripts/seed-activities.mjs --parks     ← seed national parks only
 *   node --env-file=.env.local scripts/seed-activities.mjs --intl      ← seed international only
 *
 * Once the DB is populated, generate-activities/route.js returns results
 * instantly from cache instead of calling Claude on every user request.
 *
 * Model: claude-sonnet-4-6 (supports 16K output)
 * Cost:  ~$0.15–0.20 per destination  ·  ~$17–22 for full seed run
 * Time:  ~10–15 min for all 110 destinations (2s delay between calls)
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ── Env check ────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY       = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL            = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌  Missing env vars. Run with:");
  console.error("    node --env-file=.env.local scripts/seed-activities.mjs");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase  = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// ── Destination list ─────────────────────────────────────────────────────────
// type: "city" | "national_park" | "international"
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

  // ── National Parks ───────────────────────────────────────────────────
  { city: "Yellowstone",              state: "WY", country: "US", type: "national_park" },
  { city: "Yosemite",                 state: "CA", country: "US", type: "national_park" },
  { city: "Grand Canyon",             state: "AZ", country: "US", type: "national_park" },
  { city: "Zion",                     state: "UT", country: "US", type: "national_park" },
  { city: "Glacier",                  state: "MT", country: "US", type: "national_park" },
  { city: "Grand Teton",              state: "WY", country: "US", type: "national_park" },
  { city: "Rocky Mountain",           state: "CO", country: "US", type: "national_park" },
  { city: "Bryce Canyon",             state: "UT", country: "US", type: "national_park" },
  { city: "Olympic",                  state: "WA", country: "US", type: "national_park" },
  { city: "Acadia",                   state: "ME", country: "US", type: "national_park" },
  { city: "Arches",                   state: "UT", country: "US", type: "national_park" },
  { city: "Mount Rainier",            state: "WA", country: "US", type: "national_park" },
  { city: "Sequoia",                  state: "CA", country: "US", type: "national_park" },
  { city: "Death Valley",             state: "CA", country: "US", type: "national_park" },
  { city: "Denali",                   state: "AK", country: "US", type: "national_park" },
  { city: "Hawaii Volcanoes",         state: "HI", country: "US", type: "national_park" },
  { city: "Canyonlands",              state: "UT", country: "US", type: "national_park" },
  { city: "Redwood",                  state: "CA", country: "US", type: "national_park" },
  { city: "Kenai Fjords",             state: "AK", country: "US", type: "national_park" },
  { city: "Great Smoky Mountains",    state: "TN", country: "US", type: "national_park" },
  { city: "Joshua Tree",              state: "CA", country: "US", type: "national_park" },
  { city: "Badlands",                 state: "SD", country: "US", type: "national_park" },
  { city: "Capitol Reef",             state: "UT", country: "US", type: "national_park" },
  { city: "Everglades",               state: "FL", country: "US", type: "national_park" },
  { city: "Big Bend",                 state: "TX", country: "US", type: "national_park" },
  { city: "Glacier Bay",              state: "AK", country: "US", type: "national_park" },
  { city: "North Cascades",           state: "WA", country: "US", type: "national_park" },
  { city: "Great Sand Dunes",         state: "CO", country: "US", type: "national_park" },
  { city: "Black Canyon of the Gunnison", state: "CO", country: "US", type: "national_park" },
  { city: "Channel Islands",          state: "CA", country: "US", type: "national_park" },

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

// ── Prompts ──────────────────────────────────────────────────────────────────

const CITY_SYSTEM_PROMPT = `You are an expert family travel planner specializing in trips with young children (ages 0-12).

Generate exactly 40 real, family-friendly activities for the destination provided.

CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences. Start with [ and end with ].

Each activity object MUST include ALL of these fields:
{
  "id": "snake_case_unique_id",
  "name": "Official place name",
  "type": "attraction" | "park" | "outdoors" | "culture" | "museum" | "food" | "entertainment" | "hike",
  "duration_category": "full_day" | "half_day" | "2-4h" | "1-2h" | "under_1h",
  "duration_mins_typical": <number: realistic middle estimate in minutes>,
  "duration_mins_min": <number: minimum realistic visit>,
  "duration_mins_max": <number: maximum realistic visit>,
  "hours": "<human readable hours, e.g. Daily 9am-5pm>",
  "notes": "<2-3 practical tips for parents with young kids — stroller info, entry tips, logistics>",
  "location": "<full street address>",
  "age_min": <minimum recommended age, 0 for all ages>,
  "age_max": <maximum recommended age, null if suitable for all>,
  "stroller_accessible": true | false,
  "food_onsite": true | false,
  "food_nearby": true | false,
  "admission_adult_usd": <number or null if free>,
  "admission_child_usd": <number or null>,
  "booking_required": true | false,
  "affiliate": "<real official website URL>"
}

DURATION CATEGORY RULES (critical for smart scheduling):
- "full_day": 6+ hours — theme parks, major zoos, water parks
- "half_day": 3-5 hours — large museums, aquariums, major parks
- "2-4h": 2-4 hours — focused museums, historic districts, beach visits, botanical gardens
- "1-2h": 1-2 hours — small parks, playgrounds, short hikes, quick cultural stops
- "under_1h": under 1 hour — viewpoints, quick food stops, brief exhibits

QUALITY REQUIREMENTS for all 40 activities:
- Real places only (must actually exist at this location)
- Mix: indoor + outdoor, free + paid, various age groups, rainy-day backups
- At least 8 activities suitable for infants/toddlers (stroller_accessible: true, age_min: 0)
- At least 5 free or low-cost options
- Include best family restaurants and food markets
- Include neighborhood parks and playgrounds
- Include full-day options if destination has theme parks or major attractions
- Practical notes focused on stroller logistics, skip-the-line tips, best entry times`;

const PARK_SYSTEM_PROMPT = `You are an expert national park guide specializing in family trips with young children (ages 0-12).

Generate exactly 40 family-friendly trails, activities, and experiences for the national park provided.

CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation. Start with [ and end with ].

Each activity object MUST include ALL of these fields:
{
  "id": "snake_case_unique_id",
  "name": "Trail or location name",
  "type": "hike" | "outdoors" | "culture" | "entertainment" | "park",
  "duration_category": "full_day" | "half_day" | "2-4h" | "1-2h" | "under_1h",
  "duration_mins_typical": <number>,
  "duration_mins_min": <number>,
  "duration_mins_max": <number>,
  "hours": "<seasonal hours or 'Sunrise to Sunset' or '24 hours'>",
  "notes": "<trail distance, elevation gain, stroller/kid suitability, best season, safety tips>",
  "location": "<trailhead address, visitor center address, or GPS coordinates>",
  "age_min": <0 for easy paved walks, higher for strenuous hikes>,
  "age_max": null,
  "stroller_accessible": true | false,
  "food_onsite": true | false,
  "food_nearby": true | false,
  "admission_adult_usd": <park entrance fee or null for free>,
  "admission_child_usd": <park entrance fee or null>,
  "booking_required": true | false,
  "affiliate": "<nps.gov URL for this park>"
}

QUALITY REQUIREMENTS for all 40 activities:
- Mix difficulty: easy paved walks → moderate trails (avoid strenuous/dangerous)
- At least 10 stroller_accessible activities (paved paths, visitor centers, scenic drives, easy boardwalks)
- Include: main visitor center, best viewpoints, scenic drives, ranger programs
- Include: Junior Ranger Program (age_min: 4, booking_required: false)
- Include: campfire programs, wildlife viewing spots, interpretive trails
- Trailhead GPS or street address where possible
- notes MUST include: distance in miles, terrain type, stroller suitability clearly stated
- Mark booking_required: true for timed entry permits, specific ranger tours
- Entrance fee counts as admission for most activities (pass it through for all NPS entries)
- Focus on what families with kids 0-10 can actually do and enjoy`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseActivities(text) {
  const start = text.indexOf("[");
  const end   = text.lastIndexOf("]");

  // Strategy 1: full clean array
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* fall through */ }
  }

  // Strategy 2: truncated — close at last complete object
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
  const { city, state, country, type } = dest;
  const citySlug = toSlug(city);
  const ispark   = type === "national_park";

  // Build location string for the prompt
  const location = state
    ? `${city} ${ispark ? "National Park" : ""}, ${state}`.replace(/\s+,/, ",").trim()
    : `${city}, ${country}`;

  const systemPrompt = ispark ? PARK_SYSTEM_PROMPT : CITY_SYSTEM_PROMPT;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Generate 40 family-friendly ${ispark ? "trails and activities" : "activities"} for: ${location}. Return ONLY a JSON array.`,
    }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const activities = parseActivities(text);

  if (!Array.isArray(activities) || activities.length < 10) {
    throw new Error(`Only got ${activities?.length ?? 0} activities — too few, skipping`);
  }

  // Delete existing pre-seeded activities for this destination
  let del = supabase
    .from("activities")
    .delete()
    .ilike("destination_city", city)
    .eq("source", "pre_seeded");
  if (state) del = del.ilike("destination_state", state);
  const { error: delError } = await del;
  if (delError) throw new Error(`Delete failed: ${delError.message}`);

  // Build rows with prefixed external_id for deduplication on re-runs
  const rows = activities.map((a) => ({
    external_id:          `${citySlug}_${toSlug(a.id ?? a.name)}`,
    name:                 a.name,
    type:                 a.type ?? "attraction",
    destination_city:     city,
    destination_state:    state ?? null,
    destination_country:  country,
    address:              a.location ?? null,
    hours:                typeof a.hours === "string" ? { display: a.hours } : (a.hours ?? null),
    duration_mins_typical: a.duration_mins_typical ?? a.duration_mins ?? null,
    duration_mins_min:    a.duration_mins_min ?? null,
    duration_mins_max:    a.duration_mins_max ?? null,
    duration_category:    a.duration_category ?? null,
    age_min:              a.age_min ?? 0,
    age_max:              a.age_max ?? null,
    stroller_accessible:  a.stroller_accessible ?? true,
    admission_adult_usd:  a.admission_adult_usd ?? null,
    admission_child_usd:  a.admission_child_usd ?? null,
    booking_required:     a.booking_required ?? false,
    food_onsite:          a.food_onsite ?? false,
    food_nearby:          a.food_nearby ?? true,
    affiliate_url:        a.affiliate ?? null,
    ai_tips:              a.notes ?? null,
    source:               "pre_seeded",
    updated_at:           new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from("activities").insert(rows);
  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

  return rows.length;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2] ?? "";

  let targets;
  if (arg === "--parks") {
    targets = DESTINATIONS.filter((d) => d.type === "national_park");
  } else if (arg === "--intl") {
    targets = DESTINATIONS.filter((d) => d.type === "international");
  } else if (arg === "--cities") {
    targets = DESTINATIONS.filter((d) => d.type === "city");
  } else if (arg && !arg.startsWith("--")) {
    // Filter by partial name match
    const filter = arg.toLowerCase();
    targets = DESTINATIONS.filter((d) => d.city.toLowerCase().includes(filter));
    if (!targets.length) {
      console.error(`No destinations match "${arg}"`);
      process.exit(1);
    }
  } else {
    targets = DESTINATIONS;
  }

  console.log(`\n🌍  Seeding ${targets.length} destinations (claude-sonnet-4-6, 40 activities each)\n`);
  console.log(`    Estimated time: ${Math.round(targets.length * 12 / 60)} min`);
  console.log(`    Estimated cost: ~$${(targets.length * 0.25).toFixed(0)}\n`);
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
        console.log(`✓  ${count} activities${attempt > 1 ? ` (retry ${attempt - 1})` : ""}`);
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
