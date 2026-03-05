import { createClient } from "../../../lib/supabase/server";

// GET /api/trips — list all trips for the authenticated user
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("trips")
    .select("id, name, destination_name, start_date, end_date, status, share_token, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/trips — save a new trip
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    profile,
    activities,
    itinerary,
  } = body;

  if (!name || !profile || !itinerary) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const startDate = itinerary.days[0]?.date;
  const endDate = itinerary.days[itinerary.days.length - 1]?.date;

  // 1. Create the trip record
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      name,
      destination_name: profile.destination,
      start_date: startDate,
      end_date: endDate,
      status: "planning",
      profile_snapshot: profile,
      activities_snapshot: activities ?? [],
    })
    .select()
    .single();

  if (tripError) return Response.json({ error: tripError.message }, { status: 500 });

  // 2. Create trip_days and schedule_blocks
  const wakeTime = profile.wake_time ?? "07:00";
  const bedTime = profile.bed_time ?? "20:00";

  for (const day of itinerary.days) {
    const { data: tripDay, error: dayError } = await supabase
      .from("trip_days")
      .insert({
        trip_id: trip.id,
        date: day.date,
        wake_time: wakeTime,
        bed_time: bedTime,
      })
      .select()
      .single();

    if (dayError) continue;

    // Insert schedule blocks for this day
    const blocks = (day.slots ?? []).map((slot, idx) => {
      const startMins = timeToMins(slot.start);
      const endMins = startMins + (slot.duration_mins ?? 60);
      return {
        trip_day_id: tripDay.id,
        block_type: slot.type === "rest" ? (slot.title?.includes("Nap") ? "nap" : "meal") : "activity",
        title: slot.title,
        start_time: minsToTime(startMins),
        end_time: minsToTime(endMins),
        location_name: slot.location ?? null,
        position: idx,
      };
    });

    if (blocks.length > 0) {
      await supabase.from("schedule_blocks").insert(blocks);
    }
  }

  return Response.json({ id: trip.id, share_token: trip.share_token }, { status: 201 });
}

function timeToMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minsToTime(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
