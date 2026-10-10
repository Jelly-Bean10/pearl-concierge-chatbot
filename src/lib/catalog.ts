import type { CitySlug } from "./types";

// The cities loaded into the database. Must match CITIES in scraper/scrape.py.
export const CITIES: { slug: CitySlug; name: string }[] = [
  { slug: "new-york-city", name: "New York City" },
  { slug: "london", name: "London" },
  { slug: "paris", name: "Paris" },
  { slug: "los-angeles", name: "Los Angeles" },
  { slug: "berlin", name: "Berlin" },
  { slug: "san-francisco", name: "San Francisco" },
  { slug: "austin", name: "Austin" },
  { slug: "barcelona", name: "Barcelona" },
  { slug: "amsterdam", name: "Amsterdam" },
  { slug: "lisbon", name: "Lisbon" },
  { slug: "tokyo", name: "Tokyo" },
  { slug: "miami", name: "Miami" },
];

export const CITY_SLUGS = CITIES.map((c) => c.slug);

export function cityBySlug(slug: string | null | undefined) {
  return CITIES.find((c) => c.slug === slug) ?? null;
}

// Must match CATEGORY_LABELS in scraper/scrape.py.
export const CATEGORIES: Record<string, string> = {
  activities: "Activities",
  "arts-and-culture": "Arts & Culture",
  bakeries: "Bakeries",
  bars: "Bars",
  breakfast: "Breakfast",
  cafes: "Cafes",
  dinner: "Dinner",
  "health-and-wellness": "Health & Wellness",
  "kid-friendly": "Kid Friendly",
  "late-night-food": "Late Night Food",
  "live-entertainment": "Live Entertainment",
  lunch: "Lunch",
  markets: "Markets",
  neighborhoods: "Neighborhoods",
  nightlife: "Nightlife",
  "outdoor-drinks": "Outdoor Drinks",
  "parks-and-nature": "Parks & Nature",
  services: "Services",
  shopping: "Shopping",
  sightseeing: "Sightseeing",
  stays: "Stays",
  "weekend-trips": "Weekend Trips",
  workspaces: "Workspaces",
};

export const CATEGORY_SLUGS = Object.keys(CATEGORIES);

// Categories where asking the venue for a table, a slot or a visit makes sense. Shops, cafes, parks and
// neighbourhoods get no "Request this" button.
export const REQUESTABLE_CATEGORIES = new Set([
  "dinner",
  "lunch",
  "breakfast",
  "bars",
  "nightlife",
  "outdoor-drinks",
  "late-night-food",
  "live-entertainment",
  "activities",
  "arts-and-culture",
  "health-and-wellness",
  "stays",
]);
