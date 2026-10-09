import { CITIES, cityBySlug } from "./catalog";
import type { Plan } from "./planner";
import type { PlaceCard } from "./types";

const FOOD = ["dinner", "lunch", "breakfast", "cafes", "bakeries", "late-night-food", "markets"];
const DRINKS = ["bars", "nightlife", "outdoor-drinks", "live-entertainment"];
const CULTURE = [
  "arts-and-culture",
  "sightseeing",
  "activities",
  "parks-and-nature",
  "neighborhoods",
  "kid-friendly",
  "weekend-trips",
];

/** Three follow-up chips shown under an assistant message. Deterministic: no extra model call. */
export function buildSuggestions(plan: Plan, cited: PlaceCard[]): string[] {
  const city = cityBySlug(plan.city);

  if (plan.intent === "need_city" || plan.intent === "unsupported_city" || !city) {
    return CITIES.slice(0, 3).map((c) => `Hidden gems in ${c.name}`);
  }
  if (plan.intent !== "recommend") {
    return [`Hidden gems in ${city.name}`, `Dinner tonight in ${city.name}`, `Book an experience in ${city.name}`];
  }
  if (cited.length === 0) {
    return [`Hidden gems in ${city.name}`, `Best cafes in ${city.name}`, `Things to do in ${city.name}`];
  }

  const category = cited[0].categorySlug;
  const pairing = FOOD.includes(category)
    ? "Where should I go for drinks after?"
    : DRINKS.includes(category)
      ? "Where can I eat late nearby?"
      : CULTURE.includes(category)
        ? "Somewhere good to eat nearby?"
        : `Hidden gems in ${city.name}`;
  const anyPricey = cited.some((p) => (p.priceRange?.length ?? 0) >= 2);
  return [anyPricey ? "Something cheaper" : "Something more upscale", "Show me different options", pairing];
}
