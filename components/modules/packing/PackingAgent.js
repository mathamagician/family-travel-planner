/* ─── Module 4A: Packing Agent ─────────────────────────────────────────────
   Fetches packing list items from the master list or AI customization.
   ────────────────────────────────────────────────────────────────────────── */

import { filterPackingList } from "../../../lib/packingUtils";

/**
 * Generate a packing list from the static master list, filtered by profile/destination/activities.
 */
export function generatePackingList(profile, destination, activities) {
  return filterPackingList(profile, destination, activities);
}

/**
 * Fetch AI-customized packing list from the API.
 * Returns array of packing items or throws on failure.
 */
export async function fetchAIPackingList(profile, activities, destination) {
  const res = await fetch("/api/generate-packing-list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, activities, destination }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.detail ?? e.error ?? "Generation failed");
  }
  const data = await res.json();
  return (data.items ?? []).map(i => ({ ...i, packed: false }));
}
