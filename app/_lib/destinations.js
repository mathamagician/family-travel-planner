/** Shared destination list and helpers — used by destination pages and sitemap */

export const DESTINATIONS = [
  // US Metropolises
  { city: "New York City", state: "NY", country: "US", type: "city" },
  { city: "Los Angeles", state: "CA", country: "US", type: "city" },
  { city: "Chicago", state: "IL", country: "US", type: "city" },
  { city: "San Francisco", state: "CA", country: "US", type: "city" },
  { city: "Boston", state: "MA", country: "US", type: "city" },
  { city: "Washington", state: "DC", country: "US", type: "city" },
  // Florida & Theme Parks
  { city: "Orlando", state: "FL", country: "US", type: "city" },
  { city: "Miami", state: "FL", country: "US", type: "city" },
  { city: "Fort Lauderdale", state: "FL", country: "US", type: "city" },
  { city: "Tampa", state: "FL", country: "US", type: "city" },
  { city: "Key West", state: "FL", country: "US", type: "city" },
  // Sun Belt & Southwest
  { city: "Las Vegas", state: "NV", country: "US", type: "city" },
  { city: "Phoenix", state: "AZ", country: "US", type: "city" },
  { city: "Sedona", state: "AZ", country: "US", type: "city" },
  { city: "Santa Fe", state: "NM", country: "US", type: "city" },
  { city: "Albuquerque", state: "NM", country: "US", type: "city" },
  // Southern Charm & Music
  { city: "New Orleans", state: "LA", country: "US", type: "city" },
  { city: "Nashville", state: "TN", country: "US", type: "city" },
  { city: "Memphis", state: "TN", country: "US", type: "city" },
  { city: "Charleston", state: "SC", country: "US", type: "city" },
  { city: "Savannah", state: "GA", country: "US", type: "city" },
  { city: "Asheville", state: "NC", country: "US", type: "city" },
  // West Coast
  { city: "San Diego", state: "CA", country: "US", type: "city" },
  { city: "Seattle", state: "WA", country: "US", type: "city" },
  { city: "Portland", state: "OR", country: "US", type: "city" },
  { city: "Palm Springs", state: "CA", country: "US", type: "city" },
  { city: "Monterey", state: "CA", country: "US", type: "city" },
  // Texas
  { city: "Austin", state: "TX", country: "US", type: "city" },
  { city: "San Antonio", state: "TX", country: "US", type: "city" },
  { city: "Dallas", state: "TX", country: "US", type: "city" },
  { city: "Houston", state: "TX", country: "US", type: "city" },
  // Nature & Scenic
  { city: "Honolulu", state: "HI", country: "US", type: "city" },
  { city: "Maui", state: "HI", country: "US", type: "city" },
  { city: "Jackson Hole", state: "WY", country: "US", type: "city" },
  { city: "West Yellowstone", state: "MT", country: "US", type: "city" },
  { city: "Anchorage", state: "AK", country: "US", type: "city" },
  // Mountain & Cultural
  { city: "Denver", state: "CO", country: "US", type: "city" },
  { city: "Salt Lake City", state: "UT", country: "US", type: "city" },
  { city: "Aspen", state: "CO", country: "US", type: "city" },
  { city: "Taos", state: "NM", country: "US", type: "city" },
  // Midwest & Northeast
  { city: "St. Louis", state: "MO", country: "US", type: "city" },
  { city: "Philadelphia", state: "PA", country: "US", type: "city" },
  { city: "Baltimore", state: "MD", country: "US", type: "city" },
  { city: "Pittsburgh", state: "PA", country: "US", type: "city" },
  { city: "Minneapolis", state: "MN", country: "US", type: "city" },
  { city: "Provincetown", state: "MA", country: "US", type: "city" },
  { city: "Brooklyn", state: "NY", country: "US", type: "city" },
  // National Parks
  { city: "Yellowstone", state: "WY", country: "US", type: "national_park" },
  { city: "Yosemite", state: "CA", country: "US", type: "national_park" },
  { city: "Grand Canyon", state: "AZ", country: "US", type: "national_park" },
  { city: "Zion", state: "UT", country: "US", type: "national_park" },
  { city: "Glacier", state: "MT", country: "US", type: "national_park" },
  { city: "Grand Teton", state: "WY", country: "US", type: "national_park" },
  { city: "Rocky Mountain", state: "CO", country: "US", type: "national_park" },
  { city: "Bryce Canyon", state: "UT", country: "US", type: "national_park" },
  { city: "Olympic", state: "WA", country: "US", type: "national_park" },
  { city: "Acadia", state: "ME", country: "US", type: "national_park" },
  { city: "Arches", state: "UT", country: "US", type: "national_park" },
  { city: "Mount Rainier", state: "WA", country: "US", type: "national_park" },
  { city: "Sequoia", state: "CA", country: "US", type: "national_park" },
  { city: "Death Valley", state: "CA", country: "US", type: "national_park" },
  { city: "Denali", state: "AK", country: "US", type: "national_park" },
  { city: "Hawaii Volcanoes", state: "HI", country: "US", type: "national_park" },
  { city: "Canyonlands", state: "UT", country: "US", type: "national_park" },
  { city: "Redwood", state: "CA", country: "US", type: "national_park" },
  { city: "Kenai Fjords", state: "AK", country: "US", type: "national_park" },
  { city: "Great Smoky Mountains", state: "TN", country: "US", type: "national_park" },
  { city: "Joshua Tree", state: "CA", country: "US", type: "national_park" },
  { city: "Badlands", state: "SD", country: "US", type: "national_park" },
  { city: "Capitol Reef", state: "UT", country: "US", type: "national_park" },
  { city: "Everglades", state: "FL", country: "US", type: "national_park" },
  { city: "Big Bend", state: "TX", country: "US", type: "national_park" },
  { city: "Glacier Bay", state: "AK", country: "US", type: "national_park" },
  { city: "North Cascades", state: "WA", country: "US", type: "national_park" },
  { city: "Great Sand Dunes", state: "CO", country: "US", type: "national_park" },
  { city: "Black Canyon of the Gunnison", state: "CO", country: "US", type: "national_park" },
  { city: "Channel Islands", state: "CA", country: "US", type: "national_park" },
  // International — Europe
  { city: "Rome", state: null, country: "IT", type: "international" },
  { city: "Paris", state: null, country: "FR", type: "international" },
  { city: "London", state: null, country: "GB", type: "international" },
  { city: "Barcelona", state: null, country: "ES", type: "international" },
  { city: "Florence", state: null, country: "IT", type: "international" },
  { city: "Bern", state: null, country: "CH", type: "international" },
  { city: "Berlin", state: null, country: "DE", type: "international" },
  { city: "Frankfurt", state: null, country: "DE", type: "international" },
  { city: "Aix-en-Provence", state: null, country: "FR", type: "international" },
  { city: "Lisbon", state: null, country: "PT", type: "international" },
  { city: "Athens", state: null, country: "GR", type: "international" },
  { city: "Venice", state: null, country: "IT", type: "international" },
  { city: "Monaco", state: null, country: "MC", type: "international" },
  { city: "Vienna", state: null, country: "AT", type: "international" },
  { city: "Prague", state: null, country: "CZ", type: "international" },
  { city: "Munich", state: null, country: "DE", type: "international" },
  { city: "Dublin", state: null, country: "IE", type: "international" },
  { city: "Belfast", state: null, country: "GB", type: "international" },
  { city: "Edinburgh", state: null, country: "GB", type: "international" },
  { city: "Inverness", state: null, country: "GB", type: "international" },
  { city: "Budapest", state: null, country: "HU", type: "international" },
  { city: "Copenhagen", state: null, country: "DK", type: "international" },
  { city: "Oslo", state: null, country: "NO", type: "international" },
  { city: "Stockholm", state: null, country: "SE", type: "international" },
  // International — Asia & Oceania
  { city: "Tokyo", state: null, country: "JP", type: "international" },
  { city: "Singapore", state: null, country: "SG", type: "international" },
  { city: "Bangkok", state: null, country: "TH", type: "international" },
  { city: "Hanoi", state: null, country: "VN", type: "international" },
  { city: "Hong Kong", state: null, country: "HK", type: "international" },
  { city: "Sydney", state: null, country: "AU", type: "international" },
  { city: "Melbourne", state: null, country: "AU", type: "international" },
  { city: "Wellington", state: null, country: "NZ", type: "international" },
  { city: "Christchurch", state: null, country: "NZ", type: "international" },
];

/** Convert city name to URL slug */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Find destination by slug */
export function findDestination(slug) {
  return DESTINATIONS.find(d => slugify(d.city) === slug) ?? null;
}
