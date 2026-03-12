/* ─── Module 2A: Activities Agent ──────────────────────────────────────────
   Fetches activities from DB cache or AI generation.
   Scores and sorts activities based on family preferences.
   ────────────────────────────────────────────────────────────────────────── */

import { TYPE_TO_PREF } from "../../shared/config";
import { isPreferred } from "../../shared/utils";

// Sample fallback activities (used when API fails and no activities loaded)
const SAMPLE_ACTIVITIES = [
  { id: "sdzoo", name: "San Diego Zoo", type: "attraction", hours: "9:00 AM – 5:00 PM", notes: "Large zoo with kid-friendly exhibits. Stroller-friendly.", location: "2920 Zoo Dr, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "balboa", name: "Balboa Park", type: "park", hours: "6:00 AM – 10:00 PM", notes: "Large park with playgrounds, museums; good for flexible days.", location: "Balboa Park, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "la_jolla_cove", name: "La Jolla Cove / Beach", type: "outdoors", hours: "Open 24 hrs; best 7 AM – 7 PM", notes: "Beach time, tide pools, easy strolls. Bring sun protection.", location: "La Jolla Cove, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "seaworld", name: "SeaWorld San Diego", type: "attraction", hours: "10:00 AM – 6:00 PM", notes: "Marine shows and aquarium exhibits; toddler-friendly areas.", location: "500 Sea World Dr, San Diego, CA", age_range: "2-12", duration_mins: 240, affiliate: "#" },
  { id: "old_town", name: "Old Town Historic Park", type: "culture", hours: "10:00 AM – 5:00 PM", notes: "Open-air historic area with shops and casual restaurants.", location: "Old Town San Diego State Historic Park", age_range: "0-12", duration_mins: 120, affiliate: "#" },
  { id: "fleet_science", name: "Fleet Science Center", type: "museum", hours: "10:00 AM – 5:00 PM", notes: "Hands-on exhibits for kids; good indoor backup.", location: "1875 El Prado, San Diego, CA", age_range: "3-12", duration_mins: 120, affiliate: "#" },
  { id: "torrey_pines", name: "Torrey Pines Reserve", type: "outdoors", hours: "7:15 AM – sunset", notes: "Short, scenic trails suitable for families.", location: "12600 N Torrey Pines Rd, La Jolla, CA", age_range: "2-12", duration_mins: 120, affiliate: "#" },
  { id: "legoland", name: "LEGOLAND California", type: "attraction", hours: "10:00 AM – 6:00 PM", notes: "Theme park designed for kids 2-12. Many rides for little ones.", location: "1 Legoland Dr, Carlsbad, CA", age_range: "2-12", duration_mins: 300, affiliate: "#" },
  { id: "birch_aquarium", name: "Birch Aquarium", type: "museum", hours: "9:00 AM – 5:00 PM", notes: "Small, manageable aquarium perfect for toddlers.", location: "2300 Expedition Way, La Jolla, CA", age_range: "0-12", duration_mins: 120, affiliate: "#" },
  { id: "mission_bay", name: "Mission Bay Park", type: "park", hours: "Open 24 hrs", notes: "Calm water, playgrounds, bike paths. Great for picnics.", location: "Mission Bay Park, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "uss_midway", name: "USS Midway Museum", type: "museum", hours: "10:00 AM – 5:00 PM", notes: "Aircraft carrier museum. Best for 4+.", location: "910 N Harbor Dr, San Diego, CA", age_range: "4-12", duration_mins: 150, affiliate: "#" },
  { id: "coronado_beach", name: "Coronado Beach", type: "outdoors", hours: "Open 24 hrs", notes: "Wide sandy beach, gentle waves.", location: "Coronado Beach, Coronado, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "sd_nat_history", name: "SD Natural History Museum", type: "museum", hours: "10:00 AM – 5:00 PM", notes: "Dinosaur exhibits kids love. Inside Balboa Park.", location: "1788 El Prado, San Diego, CA", age_range: "2-12", duration_mins: 120, affiliate: "#" },
  { id: "belmont_park", name: "Belmont Park", type: "entertainment", hours: "11:00 AM – 8:00 PM", notes: "Beachside amusement park with kiddie rides.", location: "3146 Mission Blvd, San Diego, CA", age_range: "2-12", duration_mins: 150, affiliate: "#" },
];

/**
 * Fetch activities from the API (DB cache or AI generation).
 * Returns { activities, source } or throws on failure.
 */
export async function fetchActivities(profile) {
  const res = await fetch("/api/generate-activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination: profile.destination,
      kids: profile.kids,
      trip_length_days: profile.trip_length_days,
      preferences: profile.preferences,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error " + res.status);
  const list = Array.isArray(data) ? data : (data.activities ?? []);
  if (!list.length) throw new Error("No activities returned");
  return { activities: list, source: data.source ?? "unknown" };
}

/**
 * Sort activities: preferred first, then non-preferred.
 * Returns { preferred, nonPreferred, sorted }.
 */
export function sortByPreference(activities, preferences) {
  const preferred = activities.filter(a => isPreferred(a, preferences, TYPE_TO_PREF));
  const nonPreferred = activities.filter(a => !isPreferred(a, preferences, TYPE_TO_PREF));
  return { preferred, nonPreferred, sorted: [...preferred, ...nonPreferred] };
}

/**
 * Auto-select preferred activity IDs (or all if no preferences match).
 */
export function autoSelectIds(activities, preferences) {
  const prefIds = new Set(
    activities.filter(a => isPreferred(a, preferences, TYPE_TO_PREF)).map(a => a.id)
  );
  return prefIds.size > 0 ? prefIds : new Set(activities.map(a => a.id));
}

/**
 * Get fallback sample activities.
 */
export function getSampleActivities() {
  return SAMPLE_ACTIVITIES;
}
