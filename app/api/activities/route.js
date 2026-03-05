import { createClient } from "../../../lib/supabase/server";
import { getAdminClient } from "../../../lib/supabase/admin";

const CACHE_DAYS = 30; // Refresh activities older than this

// GET /api/activities?city=San+Diego&state=CA
// Returns cached activities for a destination, or empty array if none cached
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");

  if (!city) {
    return Response.json({ error: "city is required" }, { status: 400 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CACHE_DAYS);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .ilike("destination_city", city)
    .gte("updated_at", cutoff.toISOString())
    .order("google_rating", { ascending: false, nullsFirst: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    activities: data ?? [],
    cached: (data ?? []).length > 0,
    cache_age_days: CACHE_DAYS,
  });
}

// POST /api/activities — store AI-generated activities in the DB
// Uses service role (bypasses RLS) since activities are shared across all users
export async function POST(request) {
  // Verify this is a server-to-server call (basic protection)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { activities, destination_city, destination_state } = await request.json();

  if (!activities?.length || !destination_city) {
    return Response.json({ error: "Missing activities or destination" }, { status: 400 });
  }

  // Upsert — update if external_id exists, insert otherwise
  const rows = activities.map((a) => ({
    external_id: a.id ?? null,
    name: a.name,
    type: a.type ?? "attraction",
    niche: a.niche ?? null,
    destination_city,
    destination_state: destination_state ?? null,
    destination_country: "US",
    address: a.location ?? a.address ?? null,
    hours: a.hours ?? null,
    duration_mins_typical: a.duration_mins ?? null,
    duration_mins_min: a.duration_mins_min ?? null,
    duration_mins_max: a.duration_mins_max ?? null,
    duration_category: a.duration_category ?? null,
    age_min: a.age_min ?? (a.age_range ? parseInt(a.age_range.split("-")[0]) : 0),
    age_max: a.age_max ?? (a.age_range ? parseInt(a.age_range.split("-")[1]) : null),
    stroller_accessible: a.stroller_accessible ?? true,
    admission_adult_usd: a.admission_adult_usd ?? null,
    admission_child_usd: a.admission_child_usd ?? null,
    booking_url: a.booking_url ?? null,
    food_onsite: a.food_onsite ?? false,
    food_nearby: a.food_nearby ?? true,
    affiliate_url: a.affiliate ?? a.affiliate_url ?? null,
    ai_tips: a.notes ?? null,
    tags: a.tags ?? [],
    source: "ai_generated",
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await getAdminClient()
    .from("activities")
    .upsert(rows, { onConflict: "external_id", ignoreDuplicates: false })
    .select("id");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ stored: data.length }, { status: 201 });
}
