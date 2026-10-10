import { CITIES, cityBySlug } from "./catalog";
import { t, type Lang } from "./i18n";
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

/** Three follow-up chips shown under an assistant message. Deterministic and localized: no model call. */
export function buildSuggestions(plan: Plan, cited: PlaceCard[], lang: Lang): string[] {
  const s = t(lang).sug;
  const city = cityBySlug(plan.city);

  if (plan.intent === "need_city" || plan.intent === "unsupported_city" || !city) {
    return CITIES.slice(0, 3).map((c) => s.hidden(c.name));
  }
  if (plan.intent !== "recommend") {
    return [s.hidden(city.name), s.dinner(city.name), s.book(city.name)];
  }
  if (cited.length === 0) {
    return [s.hidden(city.name), s.cafes(city.name), s.things(city.name)];
  }

  const category = cited[0].categorySlug;
  const pairing = FOOD.includes(category)
    ? s.drinksAfter
    : DRINKS.includes(category)
      ? s.eatLate
      : CULTURE.includes(category)
        ? s.eatNearby
        : s.hidden(city.name);
  const anyPricey = cited.some((p) => (p.priceRange?.length ?? 0) >= 2);
  return [anyPricey ? s.cheaper : s.pricier, s.different, pairing];
}
