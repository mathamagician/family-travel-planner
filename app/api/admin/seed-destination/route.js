import Anthropic from "@anthropic-ai/sdk";
import { getAdminClient } from "../../../../lib/supabase/admin";

export const maxDuration = 60; // Vercel Pro allows up to 300s; 60s covers single-destination seeding

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Auth ─────────────────────────────────────────────────────────────────────
function isAuthorized(request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ── Prompts (same as seed script) ────────────────────────────────────────────
const CITY_SYSTEM_PROMPT = `You are an expert family travel planner specializing in trips with young children (ages 0-12).
Generate exactly 40 real, family-friendly activities for the destination provided.
CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation. Start with [ and end with ].
Each object: {"id":"snake_case","name":"Place name","type":"attraction"|"park"|"outdoors"|"culture"|"museum"|"food"|"entertainment"|"hike","duration_category":"full_day"|"half_day"|"2-4h"|"1-2h"|"under_1h","duration_mins_typical":<n>,"duration_mins_min":<n>,"duration_mins_max":<n>,"hours":"<human readable>","notes":"<2-3 parent tips>","location":"<full address>","age_min":<n>,"age_max":<n|null>,"stroller_accessible":true|false,"food_onsite":true|false,"food_nearby":true|false,"admission_adult_usd":<n|null>,"admission_child_usd":<n|null>,"booking_required":true|false,"affiliate":"<url>"}
DURATION: full_day=6+h, half_day=3-5h, 2-4h=2-4h, 1-2h=1-2h, under_1h=<1h
Include: 8+ toddler-friendly, 5+ free options, indoor+outdoor mix, parks, food markets, theme parks if applicable.`;

const PARK_SYSTEM_PROMPT = `You are an expert national park guide specializing in family trips with young children (ages 0-12).
Generate exactly 40 family-friendly trails, activities, and experiences for the national park provided.
CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation. Start with [ and end with ].
Each object: {"id":"snake_case","name":"Trail/location name","type":"hike"|"outdoors"|"culture"|"entertainment"|"park","duration_category":"full_day"|"half_day"|"2-4h"|"1-2h"|"under_1h","duration_mins_typical":<n>,"duration_mins_min":<n>,"duration_mins_max":<n>,"hours":"<hours>","notes":"<distance, elevation, stroller info, tips>","location":"<trailhead or address>","age_min":<n>,"age_max":null,"stroller_accessible":true|false,"food_onsite":true|false,"food_nearby":true|false,"admission_adult_usd":<n|null>,"admission_child_usd":<n|null>,"booking_required":true|false,"affiliate":"<nps.gov url>"}
Include: 10+ stroller-accessible, visitor centers, scenic drives, Junior Ranger program, ranger programs, wildlife spots.`;

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
}

function parseActivities(text) {
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
  throw new Error("Could not parse JSON from Claude response");
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { city, state, country = "US", type = "city" } = await request.json();
    if (!city) return Response.json({ error: "city is required" }, { status: 400 });

    const ispark   = type === "national_park";
    const citySlug = toSlug(city);
    const location = state
      ? `${city}${ispark ? " National Park" : ""}, ${state}`
      : `${city}, ${country}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: ispark ? PARK_SYSTEM_PROMPT : CITY_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Generate 40 family-friendly activities for: ${location}. Return ONLY a JSON array.`,
      }],
    });

    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const activities = parseActivities(text);

    if (!Array.isArray(activities) || activities.length < 10) {
      throw new Error(`Only ${activities?.length ?? 0} activities returned — too few`);
    }

    const admin = getAdminClient();

    // Delete existing pre-seeded data for this destination
    let del = admin.from("activities").delete().ilike("destination_city", city).eq("source", "pre_seeded");
    if (state) del = del.ilike("destination_state", state);
    await del;

    // Insert fresh batch
    const rows = activities.map((a) => ({
      external_id:           `${citySlug}_${toSlug(a.id ?? a.name)}`,
      name:                  a.name,
      type:                  a.type ?? "attraction",
      destination_city:      city,
      destination_state:     state ?? null,
      destination_country:   country,
      address:               a.location ?? null,
      hours:                 typeof a.hours === "string" ? { display: a.hours } : (a.hours ?? null),
      duration_mins_typical: a.duration_mins_typical ?? null,
      duration_mins_min:     a.duration_mins_min ?? null,
      duration_mins_max:     a.duration_mins_max ?? null,
      duration_category:     a.duration_category ?? null,
      age_min:               a.age_min ?? 0,
      age_max:               a.age_max ?? null,
      stroller_accessible:   a.stroller_accessible ?? true,
      admission_adult_usd:   a.admission_adult_usd ?? null,
      admission_child_usd:   a.admission_child_usd ?? null,
      booking_required:      a.booking_required ?? false,
      food_onsite:           a.food_onsite ?? false,
      food_nearby:           a.food_nearby ?? true,
      affiliate_url:         a.affiliate ?? null,
      ai_tips:               a.notes ?? null,
      source:                "pre_seeded",
      updated_at:            new Date().toISOString(),
    }));

    const { error } = await admin.from("activities").insert(rows);
    if (error) throw new Error(`Insert failed: ${error.message}`);

    return Response.json({ seeded: rows.length, destination: location });
  } catch (error) {
    console.error("Seed destination error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
