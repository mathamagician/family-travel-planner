import Anthropic from "@anthropic-ai/sdk";
import { getAdminClient } from "../../../../lib/supabase/admin";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function isAuthorized(request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

const SYSTEM_PROMPT = `You are an expert family travel planner specializing in finding kid-friendly restaurants for families with young children (ages 0-12).
Generate exactly 14 real, family-friendly restaurants for the destination provided.
CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation. Start with [ and end with ].
Each object: {"id":"snake_case_id","name":"Name","cuisine":"american"|"mexican"|"asian"|"italian"|"seafood"|"pizza"|"bbq"|"mediterranean"|"southern"|"brunch"|"cafe"|"other","meal_type":"lunch"|"dinner"|"both","price_range":"$"|"$$"|"$$$","avg_meal_usd":<n>,"hours":"<readable>","notes":"<2-3 parent tips>","location":"<full address>","kid_menu":true|false,"highchairs":true|false,"changing_tables":true|false,"outdoor_seating":true|false,"stroller_friendly":true|false,"noise_level":"quiet"|"moderate"|"loud","wait_time_typical":"<text>","reservation_recommended":true|false,"duration_mins":<n>,"affiliate":"<url>"}
Include: mix of cuisines, 3+ kid menus, 2+ budget ($), mix of lunch/dinner/both, 2+ outdoor seating. Real restaurants only.`;

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
}

function parseRestaurants(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
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
    const { city, state, country = "US" } = await request.json();
    if (!city) return Response.json({ error: "city is required" }, { status: 400 });

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

    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const restaurants = parseRestaurants(text);

    if (!Array.isArray(restaurants) || restaurants.length < 5) {
      throw new Error(`Only ${restaurants?.length ?? 0} restaurants returned — too few`);
    }

    const admin = getAdminClient();

    // Delete existing pre-seeded data for this destination
    let del = admin.from("restaurants").delete().ilike("destination_city", city).eq("source", "pre_seeded");
    if (state) del = del.ilike("destination_state", state);
    await del;

    // Insert fresh batch
    const rows = restaurants.map((r) => ({
      external_id: `${citySlug}_${toSlug(r.id ?? r.name)}`,
      name: r.name,
      cuisine: r.cuisine ?? "other",
      meal_type: r.meal_type ?? "both",
      price_range: r.price_range ?? "$$",
      avg_meal_usd: r.avg_meal_usd ?? null,
      hours: r.hours ?? null,
      notes: r.notes ?? null,
      location: r.location ?? null,
      kid_menu: r.kid_menu ?? false,
      highchairs: r.highchairs ?? false,
      changing_tables: r.changing_tables ?? false,
      outdoor_seating: r.outdoor_seating ?? false,
      stroller_friendly: r.stroller_friendly ?? true,
      noise_level: r.noise_level ?? "moderate",
      wait_time_typical: r.wait_time_typical ?? null,
      reservation_recommended: r.reservation_recommended ?? false,
      duration_mins: r.duration_mins ?? 60,
      affiliate: r.affiliate ?? null,
      destination_city: city,
      destination_state: state ?? null,
      destination_country: country,
      source: "pre_seeded",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await admin.from("restaurants").insert(rows);
    if (error) throw new Error(`Insert failed: ${error.message}`);

    return Response.json({ seeded: rows.length, destination: location });
  } catch (error) {
    console.error("Seed restaurants error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
