import { MASTER_PACKING_LIST } from "../data/packingMasterList";

// ── Climate classifier ──────────────────────────────────────────────────────
// Returns a Set of climate tags based on destination keywords + trip date.

const WARM_CITIES = /san diego|miami|orlando|hawaii|maui|oahu|cancun|cabo|phoenix|scottsdale|las vegas|tampa|fort lauderdale|key west|puerto rico|bahamas|myrtle beach|savannah|charleston|new orleans|austin|houston|dallas|los angeles|la |anaheim|santa barbara/i;

const COLD_CITIES = /denver|aspen|vail|breckenridge|telluride|chicago|minneapolis|boston|new york|nyc|buffalo|cleveland|detroit|milwaukee|pittsburgh|philadelphia|albany|burlington|montreal|toronto|anchorage|juneau/i;

const BEACH_PLACES = /beach|coast|coastal|island|hawaii|maui|oahu|kauai|cancun|cabo|bahamas|bermuda|caribbean|myrtle beach|outer banks|obx|virginia beach|gulf shore|destin|clearwater|siesta|tulum|riviera maya|san diego|miami|fort lauderdale|key west|jersey shore|hamptons|nantucket/i;

const MOUNTAIN_PLACES = /mountain|mountains|national park|yellowstone|yosemite|grand canyon|zion|bryce|rocky mountain|glacier|mt\.|mount |aspen|vail|park city|lake tahoe|tahoe|jackson hole|telluride|breckenridge|steamboat|crested butte|mammoth|alta|snowbird|ski|skiing|snowboard/i;

const SKI_PLACES = /ski|skiing|snowboard|aspen|vail|park city|lake tahoe|tahoe|jackson hole|telluride|breckenridge|steamboat|crested butte|mammoth|alta|snowbird|whistler|stowe|killington/i;

const RAIN_CITIES = /seattle|portland|new orleans|savannah|juneau|anchorage|london|vancouver/i;

const OUTDOOR_ACTIVITY_TYPES = new Set(["hike", "outdoors", "park"]);

export function classifyClimate(destination, startDate) {
  const tags = new Set(["always"]);
  const dest = destination ?? "";

  // Season from trip date
  const month = startDate
    ? new Date(startDate + "T00:00:00").getMonth() + 1 // 1–12
    : new Date().getMonth() + 1;

  if (month >= 6 && month <= 8)       tags.add("summer");
  else if (month <= 2 || month >= 12) tags.add("winter");
  else if (month >= 3 && month <= 5)  tags.add("spring");
  else                                tags.add("fall");

  // Hot: summer season OR warm-city destination
  if (tags.has("summer") || WARM_CITIES.test(dest)) {
    tags.add("hot");
    tags.add("sunny");
  }

  // Cold: winter season OR cold-city destination
  if (tags.has("winter") || COLD_CITIES.test(dest)) {
    tags.add("cold");
  }

  // Beach
  if (BEACH_PLACES.test(dest)) {
    tags.add("beach");
    tags.add("water");
  }

  // Mountain
  if (MOUNTAIN_PLACES.test(dest)) {
    tags.add("mountain");
    tags.add("outdoor");
  }

  // Ski (mountain + cold)
  if (SKI_PLACES.test(dest) && (tags.has("cold") || tags.has("winter"))) {
    tags.add("ski");
  }

  // Rain
  if (RAIN_CITIES.test(dest) || tags.has("spring") || tags.has("fall")) {
    tags.add("rain");
  }

  return tags;
}

// ── Packing list filter ─────────────────────────────────────────────────────
// Returns a filtered + annotated array ready for PackingList component state.

export function filterPackingList(profile, destination, activities = []) {
  const climateTags = classifyClimate(destination, profile?.start_date);

  // Add 'outdoor' tag if any outdoor activity types are selected
  if ((activities ?? []).some((a) => OUTDOOR_ACTIVITY_TYPES.has(a.type))) {
    climateTags.add("outdoor");
  }

  const kids = profile?.kids ?? [];
  const hasKids = kids.length > 0;

  return MASTER_PACKING_LIST
    .filter((item) => {
      // ── Climate gate ──────────────────────────────────────────────────────
      const { climates } = item;
      if (!climates || climates.length === 0 || climates.includes("always")) {
        // no restriction
      } else {
        const hasMatch = climates.some((c) => climateTags.has(c));
        if (!hasMatch) return false;
      }

      // ── Age gate ──────────────────────────────────────────────────────────
      const { age_min, age_max } = item;
      const hasAgeGate = age_min != null || age_max != null;

      if (hasAgeGate) {
        if (!hasKids) return false; // item requires kids but profile has none
        const relevant = kids.some((k) => {
          const age = k.age ?? 0;
          const minOk = age_min == null || age >= age_min;
          const maxOk = age_max == null || age <= age_max;
          return minOk && maxOk;
        });
        if (!relevant) return false;
      }

      return true;
    })
    .map((item) => ({ ...item, packed: false }));
}
