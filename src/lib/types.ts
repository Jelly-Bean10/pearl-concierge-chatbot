// Shared types for the chat API (server) and the chat UI (client).

export type CitySlug = "new-york-city" | "london" | "paris" | "los-angeles";

export type Role = "user" | "assistant";

/** One prior turn. Assistant content is sent back as plain text with citation markers removed. */
export interface ChatTurn {
  role: Role;
  content: string;
}

/** POST /api/chat request body. */
export interface ChatRequest {
  messages: ChatTurn[]; // oldest first, last item must be the new user message
  city: CitySlug | null; // city chip currently selected in the UI
  shownPlaceIds: number[]; // ids of places already shown as cards in this session (most recent last)
}

/** A place as sent to the browser. Every field comes straight from the database row. */
export interface PlaceCard {
  id: number; // database id
  ref: number; // 1-based citation number for this turn; the model writes [[ref]]
  url: string; // canonical pearlclub.com URL
  name: string;
  citySlug: CitySlug;
  cityName: string;
  countryFlag: string | null;
  categorySlug: string;
  categoryLabel: string;
  priceRange: string | null; // "$" | "$$" | "$$$" | "$$$$"
  summary: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  mapUrl: string | null;
  tags: string[];
}

export type Intent = "recommend" | "need_city" | "unsupported_city" | "smalltalk" | "off_topic";

export type ErrorCode =
  "bad_request" | "rate_limited" | "upstream_rate_limited" | "upstream_timeout" | "upstream_error" | "internal";

/** Body of every non-200 JSON response. */
export interface ErrorEnvelope {
  error: { code: ErrorCode; message: string };
}

/** One line of the NDJSON response stream. Order: meta, places, delta*, done. error may replace any step. */
export type StreamEvent =
  | { type: "meta"; intent: Intent; city: CitySlug | null }
  | { type: "places"; places: PlaceCard[] }
  | { type: "delta"; text: string }
  | { type: "done"; citedRefs: number[]; suggestions: string[] }
  | { type: "error"; code: ErrorCode; message: string };
