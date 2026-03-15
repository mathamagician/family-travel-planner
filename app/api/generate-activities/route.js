import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "../../../lib/supabase/server";
import { getAdminClient } from "../../../lib/supabase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CACHE_DAYS  = 30;
const CACHE_MIN   = 15; // min rows before we trust cache (pre-seeded destinations have 50)

// ── Genius system prompt ────────────────────────────────────────────────
// Teaches Claude to understand duration categories so the scheduler can
// intelligently assign activities to the right time slots.
const SYSTEM_PROMPT = `You are an expert family travel planner specializing in trips with young children (ages 0-12).

Your job: Generate a rich, accurate list of 14-18 real family-friendly activities for a destination.

CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON array.

Each activity object MUST include ALL of these fields:
{
  "id": "snake_case_unique_id",
  "name": "Official place name",
  "type": "attraction" | "park" | "outdoors" | "culture" | "museum" | "entertainment" | "hike",
  "duration_category": "full_day" | "half_day" | "2-4h" | "1-2h" | "under_1h",
  "duration_mins_typical": <number: realistic middle estimate in minutes>,
  "duration_mins_min": <number: minimum realistic visit>,
  "duration_mins_max": <number: maximum realistic visit>,
  "hours": "<human readable hours, e.g. Mon-Fri 9am-5pm>",
  "notes": "<2-3 practical tips for parents with young kids — logistics, stroller info, best entry times>",
  "location": "<full street address>",
  "age_min": <minimum recommended age, 0 for all ages>,
  "age_max": <maximum recommended age, null if suitable for all>,
  "stroller_accessible": true | false,
  "food_onsite": true | false,
  "food_nearby": true | false,
  "admission_adult_usd": <number or null if free>,
  "admission_child_usd": <number or null>,
  "booking_required": true | false,
  "affiliate": "<real website URL>"
}

DURATION CATEGORY RULES (critical for smart scheduling):
- "full_day": 6+ hours — theme parks (Disneyland, SeaWorld, LEGOLAND), major zoos, water parks
- "half_day": 3-5 hours — large museums, aquariums, major nature preserves, sprawling parks
- "2-4h": 2-4 hours — focused museums, historic districts, beach visits, botanical gardens
- "1-2h": 1-2 hours — small parks, playgrounds, short hikes, quick cultural stops
- "under_1h": under 1 hour — viewpoints, small exhibits, quick food stops, brief nature trails

QUALITY RULES:
- Real places only (must actually exist at this location)
- Mix indoor and outdoor options (rainy day backups + sunny day options)
- Include at least 2 free or low-cost options
- At least 2 activities suitable for children under 2 (stroller_accessible: true)
- Include at least one "full_day" activity if the destination has theme parks or major attractions
- Practical notes focused on what parents with strollers and napping kids actually need to know
- Do NOT include restaurants or dining spots — restaurants are handled separately. Focus only on activities, attractions, parks, museums, entertainment, and outdoor adventures.`;

function parseDestination(destination) {
  // Strip common suffixes users may include
  const cleaned = destination
    .replace(/\s+national\s+park\b/gi, "")  // "Grand Canyon National Park, AZ" → "Grand Canyon, AZ"
    .replace(/\bD\.C\.\b/gi, "DC")           // "Washington, D.C." → "Washington, DC"
    .trim();
  const parts = cleaned.split(",").map((s) => s.trim());
  return { city: parts[0] ?? cleaned, state: parts[1] ?? null };
}

async function getCachedActivities(city, state) {
  try {
    const supabase = await createClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CACHE_DAYS);

    let query = supabase
      .from("activities")
      .select("*")
      .ilike("destination_city", city)
      .gte("updated_at", cutoff.toISOString());

    if (state) query = query.ilike("destination_state", state);

    const { data } = await query.order("google_rating", { ascending: false, nullsFirst: false });
    return data?.length >= CACHE_MIN ? data : null;
  } catch {
    return null; // DB not yet configured — fall through to AI
  }
}

async function cacheActivities(activities, city, state) {
  try {
    const admin = getAdminClient();
    const rows = activities.map((a) => ({
      external_id: a.id ?? null,
      name: a.name,
      type: a.type ?? "attraction",
      destination_city: city,
      destination_state: state ?? null,
      destination_country: "US",
      address: a.location ?? null,
      hours: typeof a.hours === "string" ? { display: a.hours } : (a.hours ?? null),
      duration_mins_typical: a.duration_mins_typical ?? a.duration_mins ?? null,
      duration_mins_min: a.duration_mins_min ?? null,
      duration_mins_max: a.duration_mins_max ?? null,
      duration_category: a.duration_category ?? null,
      age_min: a.age_min ?? 0,
      age_max: a.age_max ?? null,
      stroller_accessible: a.stroller_accessible ?? true,
      admission_adult_usd: a.admission_adult_usd ?? null,
      admission_child_usd: a.admission_child_usd ?? null,
      booking_required: a.booking_required ?? false,
      food_onsite: a.food_onsite ?? false,
      food_nearby: a.food_nearby ?? true,
      affiliate_url: a.affiliate ?? null,
      ai_tips: a.notes ?? null,
      source: "ai_generated",
      updated_at: new Date().toISOString(),
    }));

    await admin.from("activities").upsert(rows, { onConflict: "external_id" });
  } catch (e) {
    console.warn("Activity caching skipped:", e.message);
  }
}

export async function POST(request) {
  try {
    const { destination, kids, trip_length_days, preferences } = await request.json();

    if (!destination || !kids?.length) {
      return Response.json({ error: "Missing destination or kids" }, { status: 400 });
    }

    const { city, state } = parseDestination(destination);

    // Phase A: Check DB cache
    const cached = await getCachedActivities(city, state);
    if (cached) {
      // Normalize DB format → frontend format
      const normalized = cached.map((a) => ({
        ...a,
        hours: typeof a.hours === "object" && a.hours !== null ? (a.hours.display ?? "") : (a.hours ?? ""),
        notes: a.ai_tips ?? "",
        duration_mins: a.duration_mins_typical ?? a.duration_mins ?? 90,
        age_range: a.age_min != null ? `${a.age_min}–${a.age_max ?? 12}` : "0–12",
      }));
      // Filter out any cached restaurant/food entries (handled by restaurant module now)
      const filtered = normalized.filter(a => a.type !== "food");
      return Response.json({ activities: filtered, source: "cache" });
    }

    // Phase A: Cache miss — generate with Claude
    const ages = kids.map((k) => k.age ?? 0).join(", ");
    const prefList = preferences
      ? Object.entries(preferences).filter(([, v]) => v).map(([k]) => k).join(", ")
      : "general mix";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Generate 14-18 family activities for: ${destination}. Children ages: ${ages}. Trip: ${trip_length_days} days. Preferences: ${prefList}. Return ONLY a JSON array with all required fields including duration_category on every item.`,
      }],
    });

    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const activities = JSON.parse(cleaned);

    if (!Array.isArray(activities)) throw new Error("Unexpected response format from AI");

    // Filter out any restaurant/food entries (handled by restaurant module now)
    const filtered = activities.filter(a => a.type !== "food");

    // Phase A: Store in DB (non-blocking)
    cacheActivities(filtered, city, state);

    return Response.json({ activities: filtered, source: "ai" });
  } catch (error) {
    console.error("Activity generation error:", error);
    return Response.json({ error: "Generation failed", detail: error.message }, { status: 500 });
  }
}
