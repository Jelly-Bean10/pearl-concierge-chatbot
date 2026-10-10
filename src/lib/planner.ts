import "server-only";
import { CATEGORY_SLUGS, CITIES, CITY_SLUGS, cityBySlug } from "./catalog";
import { CHAT_MODEL, getOpenAI } from "./clients";
import { SERVICE_TYPES, type ServiceType } from "./i18n";
import type { ChatTurn, CitySlug, Intent } from "./types";

export interface Plan {
  intent: Intent;
  searchQuery: string;
  city: CitySlug | null;
  mentionedCity: string | null;
  categories: string[];
  maxPriceLevel: number | null;
  wantsNewOptions: boolean;
  userLanguage: string | null; // English name of the language the latest user message is written in
  // Request flows (request_venue / request_hotel): what the user already told us, to prefill the form.
  placeName: string | null;
  serviceType: ServiceType | null;
  requestDate: string | null; // YYYY-MM-DD
  requestTime: string | null; // HH:MM, 24h
  partySize: number | null;
}

const PLANNER_TIMEOUT_MS = 8_000;

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "search_query",
    "city",
    "mentioned_city",
    "categories",
    "max_price_level",
    "wants_new_options",
    "user_language",
    "place_name",
    "service_type",
    "request_date",
    "request_time",
    "party_size",
  ],
  properties: {
    intent: {
      type: "string",
      enum: ["recommend", "request_venue", "request_hotel", "need_city", "unsupported_city", "smalltalk", "off_topic"],
    },
    search_query: { type: "string" },
    city: { anyOf: [{ type: "string", enum: CITY_SLUGS }, { type: "null" }] },
    mentioned_city: { anyOf: [{ type: "string" }, { type: "null" }] },
    categories: { type: "array", items: { type: "string", enum: CATEGORY_SLUGS } },
    max_price_level: { anyOf: [{ type: "integer", enum: [1, 2, 3] }, { type: "null" }] },
    wants_new_options: { type: "boolean" },
    user_language: { anyOf: [{ type: "string" }, { type: "null" }] },
    place_name: { anyOf: [{ type: "string" }, { type: "null" }] },
    service_type: { anyOf: [{ type: "string", enum: SERVICE_TYPES }, { type: "null" }] },
    request_date: { anyOf: [{ type: "string" }, { type: "null" }] },
    request_time: { anyOf: [{ type: "string" }, { type: "null" }] },
    party_size: { anyOf: [{ type: "integer" }, { type: "null" }] },
  },
} as const;

function plannerPrompt(selectedCity: CitySlug | null, today: string): string {
  const cities = CITIES.map((c) => `${c.slug} (${c.name})`).join(", ");
  return `You analyse the latest user message for Pearl, the travel concierge of Pearl Club, a guide of places curated by locals.

Supported cities: ${cities}.
Place categories: ${CATEGORY_SLUGS.join(", ")}.
City currently selected in the app: ${selectedCity ?? "none"}.
Today's date: ${today} (${new Date(today + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}).

The user may write in any language (for example Spanish, French, German, Japanese or Urdu). Understand it fully. City names may appear in the user's language ("París", "東京", "پیرس"): map them to the supported slug.

Boroughs, neighbourhoods, districts and landmarks belong to their city. Map them to the supported city that contains them: Brooklyn, Queens, Manhattan, SoHo, Harlem, Williamsburg -> new-york-city; Shoreditch, Soho (London), Camden, Notting Hill -> london; Le Marais, Montmartre -> paris; Venice Beach, Silver Lake, Hollywood -> los-angeles; Kreuzberg, Neukölln -> berlin; Mission District -> san-francisco; Gràcia, El Born -> barcelona; Shibuya, Shinjuku -> tokyo; Wynwood, South Beach -> miami; and so on for any area you recognise. A neighbourhood request is "recommend" with that city (never "need_city" or "unsupported_city"), and the neighbourhood name stays in search_query ("coffee Brooklyn"). Only use "unsupported_city" for a city or town outside the supported list.

Return JSON for the LATEST user message, using earlier turns only to resolve references.

intent:
- "recommend": the user wants places, food, drinks, things to do, experiences, stays, or more detail about a place, and a supported city is known (from the latest message, the conversation, or the selected city).
- "request_venue": the user wants to book, reserve, or request a table, ticket, tour, class, or visit at a venue, either a specific named place ("can you book me a table at Dishoom for Friday") or a kind of experience to book ("I want to book an experience"). Needs a known supported city, otherwise use "need_city".
- "request_hotel": the user wants a hotel-desk service with no specific venue: spa, late checkout, airport transfer/pickup, a restaurant reservation arranged by the hotel concierge, or another hotel request ("I need a late checkout"). No city is needed.
- "need_city": the user wants recommendations but no supported city is known from any of those sources.
- "unsupported_city": the user explicitly names a specific city or town that is not in the supported list. A request for a kind of place that merely sounds out of region (ski resorts, beaches) is NOT this: if a supported city is known, use "recommend" and let the search decide.
- "smalltalk": greetings, thanks, or questions about what Pearl can do.
- "off_topic": anything unrelated to travel, places, or plans.

search_query: for "recommend" and "request_venue" only, a short standalone search phrase describing what to find. ALWAYS write it in English, translating from whatever language the user wrote in (the place database is English). Keep proper nouns such as place and neighbourhood names unchanged. Resolve references from earlier turns ("something cheaper" after dinner suggestions becomes "affordable casual dinner restaurant"; "tell me more about the second one" becomes that place's name). Include cuisine, mood, vibe, occasion, and audience words. Never include the city name. For "request_venue" with a named place, it is that place's name; for a generic booking ("book an experience") describe the experiences to find (for example "tours classes shows cultural experiences"). Empty string for every other intent.

city: the supported city slug this request is about. Priority: a city named in the latest message, then the city of the ongoing conversation, then the selected city. null if none applies. If the latest message names an unsupported city, city is null.

mentioned_city: the city name the user asked about when it is not supported, otherwise null.

categories: 0 to 4 category slugs that clearly match. Use an empty array for broad requests ("hidden gems", "what should I do", "surprise me").
Hints: eat/restaurant/dinner -> dinner, lunch. brunch/breakfast -> breakfast, cafes. coffee/work from -> cafes, workspaces. pastry/bread -> bakeries. drinks/cocktails/wine/beer -> bars, outdoor-drinks. dancing/club -> nightlife, live-entertainment. museum/gallery/art -> arts-and-culture. landmarks/sights -> sightseeing. book an experience/things to do/activity -> activities, arts-and-culture, sightseeing, live-entertainment. hotel/where to stay -> stays. park/nature/outdoors -> parks-and-nature. shops/shopping -> shopping, markets. day trip/weekend away -> weekend-trips. kids/family -> kid-friendly.

max_price_level: 1 for cheap/budget/inexpensive, 2 for "cheaper", "not too expensive", or moderate, 3 for "nice but not crazy", otherwise null.

user_language: the English name of the language the LATEST user message is written in ("English", "Spanish", "Japanese", ...). null when the message is too short or ambiguous to tell (a single place name, a number, an emoji).

place_name: for "request_venue", the exact name of the venue the user named, otherwise null.

service_type (request_hotel only, otherwise null): spa, late_checkout, airport_transfer, restaurant_reservation, or other.

request_date: for request_venue and request_hotel, the date the user wants as YYYY-MM-DD, resolved from today's date ("Friday" is the next upcoming Friday, "tomorrow", "this weekend" is the coming Saturday). null when not said.
request_time: the time as 24-hour HH:MM ("8pm" is "20:00"). null when not said.
party_size: number of people when said ("table for four" is 4), otherwise null.

wants_new_options: true when the user asks for more, other, or different options than those already suggested; otherwise false.`;
}

/** Fallback used when the planner call fails: treat the message as a plain search in the selected city. */
function fallbackPlan(lastUserMessage: string, selectedCity: CitySlug | null): Plan {
  return {
    intent: selectedCity ? "recommend" : "need_city",
    searchQuery: lastUserMessage,
    city: selectedCity,
    mentionedCity: null,
    categories: [],
    maxPriceLevel: null,
    wantsNewOptions: false,
    userLanguage: null,
    placeName: null,
    serviceType: null,
    requestDate: null,
    requestTime: null,
    partySize: null,
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function planTurn(messages: ChatTurn[], selectedCity: CitySlug | null): Promise<Plan> {
  const lastUser = messages[messages.length - 1].content;
  try {
    const completion = await getOpenAI().chat.completions.create(
      {
        model: CHAT_MODEL,
        temperature: 0,
        max_completion_tokens: 400,
        response_format: {
          type: "json_schema",
          json_schema: { name: "plan", strict: true, schema: PLAN_SCHEMA },
        },
        messages: [
          { role: "system", content: plannerPrompt(selectedCity, new Date().toISOString().slice(0, 10)) },
          ...messages.slice(-6),
        ],
      },
      { signal: AbortSignal.timeout(PLANNER_TIMEOUT_MS) },
    );
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const plan: Plan = {
      intent: raw.intent,
      searchQuery: String(raw.search_query ?? "").trim() || lastUser,
      city: cityBySlug(raw.city)?.slug ?? null,
      mentionedCity: raw.mentioned_city ?? null,
      categories: Array.isArray(raw.categories) ? raw.categories.filter((c: string) => CATEGORY_SLUGS.includes(c)) : [],
      maxPriceLevel: typeof raw.max_price_level === "number" ? raw.max_price_level : null,
      wantsNewOptions: Boolean(raw.wants_new_options),
      userLanguage: typeof raw.user_language === "string" ? raw.user_language.trim() || null : null,
      placeName: typeof raw.place_name === "string" ? raw.place_name.trim() || null : null,
      serviceType: SERVICE_TYPES.includes(raw.service_type) ? raw.service_type : null,
      requestDate: typeof raw.request_date === "string" && ISO_DATE.test(raw.request_date) ? raw.request_date : null,
      requestTime: typeof raw.request_time === "string" && HHMM.test(raw.request_time) ? raw.request_time : null,
      partySize:
        Number.isInteger(raw.party_size) && raw.party_size >= 1 && raw.party_size <= 20 ? raw.party_size : null,
    };
    // Searching needs a city. Never search without one.
    if ((plan.intent === "recommend" || plan.intent === "request_venue") && !plan.city) plan.intent = "need_city";
    return plan;
  } catch (err) {
    console.error(JSON.stringify({ event: "planner_failed", error: String(err) }));
    return fallbackPlan(lastUser, selectedCity);
  }
}
