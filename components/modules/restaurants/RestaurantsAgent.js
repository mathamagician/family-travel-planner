/* ─── Module RA: Restaurants Agent ─────────────────────────────────────────
   Fetches restaurants from AI generation.
   Scores and sorts restaurants based on cuisine preferences.
   ────────────────────────────────────────────────────────────────────────── */

import { CUISINE_TO_PREF } from "../../shared/config";

// Sample fallback restaurants (San Diego defaults)
const SAMPLE_RESTAURANTS = [
  { id: "hodads", name: "Hodad's", cuisine: "american", meal_type: "both", price_range: "$", avg_meal_usd: 14, hours: "11am-9pm daily", notes: "Famous burgers. Loud, casual. No highchairs but counter seating works. Go before 5pm to skip lines.", location: "5010 Newport Ave, San Diego, CA", kid_menu: false, highchairs: false, outdoor_seating: true, stroller_friendly: true, noise_level: "loud", duration_mins: 45, affiliate: "#" },
  { id: "broken_yolk", name: "Broken Yolk Cafe", cuisine: "brunch", meal_type: "lunch", price_range: "$$", avg_meal_usd: 18, hours: "6am-3pm daily", notes: "Great brunch spot. Kids menu, crayons provided. Can get crowded on weekends — go early.", location: "1851 Garnet Ave, San Diego, CA", kid_menu: true, highchairs: true, outdoor_seating: true, stroller_friendly: true, noise_level: "moderate", duration_mins: 60, affiliate: "#" },
  { id: "puesto", name: "Puesto", cuisine: "mexican", meal_type: "both", price_range: "$$", avg_meal_usd: 22, hours: "11am-9pm daily", notes: "Upscale Mexican tacos. Kid-friendly but trendy. Outdoor patio is best with kids.", location: "789 W Harbor Dr, San Diego, CA", kid_menu: true, highchairs: true, outdoor_seating: true, stroller_friendly: true, noise_level: "moderate", duration_mins: 60, affiliate: "#" },
  { id: "corvette_diner", name: "Corvette Diner", cuisine: "american", meal_type: "dinner", price_range: "$$", avg_meal_usd: 16, hours: "4pm-9pm Mon-Thu, 11am-10pm Fri-Sun", notes: "50s themed diner with magic shows. Kids LOVE it. Loud and fun.", location: "2965 Historic Decatur Rd, San Diego, CA", kid_menu: true, highchairs: true, outdoor_seating: false, stroller_friendly: true, noise_level: "loud", duration_mins: 75, affiliate: "#" },
  { id: "fig_tree_cafe", name: "Fig Tree Cafe", cuisine: "cafe", meal_type: "lunch", price_range: "$$", avg_meal_usd: 20, hours: "7:30am-2pm daily", notes: "Beautiful patio. Relaxed atmosphere. Healthy kids options. Great for after-beach lunch.", location: "5119 Cass St, San Diego, CA", kid_menu: true, highchairs: true, outdoor_seating: true, stroller_friendly: true, noise_level: "quiet", duration_mins: 60, affiliate: "#" },
];

/**
 * Fetch restaurants from the API.
 * Returns { restaurants, source } or throws on failure.
 */
export async function fetchRestaurants(profile) {
  const res = await fetch("/api/generate-restaurants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination: profile.destination,
      kids: profile.kids,
      cuisine_preferences: profile.restaurants,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error " + res.status);
  const list = Array.isArray(data) ? data : (data.restaurants ?? []);
  if (!list.length) throw new Error("No restaurants returned");
  return { restaurants: list, source: data.source ?? "unknown" };
}

/**
 * Check if a restaurant matches the user's cuisine preferences.
 */
function isPreferredCuisine(restaurant, cuisinePrefs) {
  if (!cuisinePrefs || cuisinePrefs.none) return false;
  const prefKeys = CUISINE_TO_PREF[restaurant.cuisine] || CUISINE_TO_PREF.other;
  return prefKeys.some(k => cuisinePrefs[k]);
}

/**
 * Sort restaurants: preferred cuisines first, then non-preferred.
 * Returns { preferred, nonPreferred, sorted }.
 */
export function sortByPreference(restaurants, cuisinePrefs) {
  const preferred = restaurants.filter(r => isPreferredCuisine(r, cuisinePrefs));
  const nonPreferred = restaurants.filter(r => !isPreferredCuisine(r, cuisinePrefs));
  return { preferred, nonPreferred, sorted: [...preferred, ...nonPreferred] };
}

/**
 * Auto-select preferred restaurant IDs (or all if no preferences match).
 */
export function autoSelectIds(restaurants, cuisinePrefs) {
  const prefIds = new Set(
    restaurants.filter(r => isPreferredCuisine(r, cuisinePrefs)).map(r => r.id)
  );
  return prefIds.size > 0 ? prefIds : new Set(restaurants.map(r => r.id));
}

/**
 * Get fallback sample restaurants.
 */
export function getSampleRestaurants() {
  return SAMPLE_RESTAURANTS;
}
