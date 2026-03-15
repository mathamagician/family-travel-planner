/**
 * Semi-annual cron job — refreshes restaurant caches older than 170 days.
 * Vercel calls this automatically per the schedule in vercel.json (every 6 months).
 *
 * Same fire-and-forget pattern as refresh-activities.
 */

export const maxDuration = 60;

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getAdminClient } = await import("../../../../lib/supabase/admin");
    const admin = getAdminClient();

    // Find distinct destinations with stale pre-seeded restaurants (> 170 days old)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 170);

    const { data: stale, error } = await admin
      .from("restaurants")
      .select("destination_city, destination_state, destination_country")
      .eq("source", "pre_seeded")
      .lt("updated_at", cutoff.toISOString());

    if (error) throw error;

    // De-duplicate destinations
    const seen = new Set();
    const destinations = [];
    for (const row of stale ?? []) {
      const key = `${row.destination_city}|${row.destination_state ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        destinations.push({
          city: row.destination_city,
          state: row.destination_state,
          country: row.destination_country ?? "US",
        });
      }
    }

    if (!destinations.length) {
      return Response.json({ refreshed: 0, message: "All restaurant caches are fresh" });
    }

    // Fire-and-forget individual seed calls
    const origin = request.headers.get("x-forwarded-host")
      ? `https://${request.headers.get("x-forwarded-host")}`
      : process.env.NEXTAUTH_URL ?? "https://localhost:3000";
    const secret = process.env.INTERNAL_API_SECRET;

    let triggered = 0;
    for (const dest of destinations) {
      fetch(`${origin}/api/admin/seed-restaurants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secret}`,
        },
        body: JSON.stringify(dest),
      }).catch((e) => console.warn(`Restaurant seed trigger failed for ${dest.city}:`, e.message));
      triggered++;
    }

    return Response.json({ triggered, destinations: destinations.map((d) => d.city) });
  } catch (error) {
    console.error("Restaurant cron refresh error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
