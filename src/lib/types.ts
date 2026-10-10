// Shared types for the chat API (server) and the chat UI (client).

import type { FieldError, Lang, ServiceType } from "./i18n";

export type CitySlug =
  | "new-york-city"
  | "london"
  | "paris"
  | "los-angeles"
  | "berlin"
  | "san-francisco"
  | "austin"
  | "barcelona"
  | "amsterdam"
  | "lisbon"
  | "tokyo"
  | "miami";

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
  lang: Lang; // UI language selected by the user
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
  curator: { name: string; url: string; avatarUrl: string | null } | null; // the local who recommends it
}

export type Intent =
  | "recommend"
  | "request_venue" // wants to book/reserve at a venue: opens the request form (or recommends experiences to request)
  | "request_hotel" // wants a hotel desk service: spa, late checkout, airport transfer, ...
  | "need_city"
  | "unsupported_city"
  | "smalltalk"
  | "off_topic";

export type ErrorCode =
  "bad_request" | "rate_limited" | "upstream_rate_limited" | "upstream_timeout" | "upstream_error" | "internal";

/** Body of every non-200 JSON response. */
export interface ErrorEnvelope {
  error: { code: ErrorCode; message: string; fields?: Partial<Record<string, FieldError>> };
}

/** Values the assistant extracted from the user's message, used to prefill the request form. */
export interface RequestPrefill {
  kind: "venue" | "hotel";
  placeRef: number | null; // venue: 1-based ref into this turn's places
  serviceType: ServiceType | null;
  city: CitySlug | null;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM
  partySize: number | null;
}

/** One line of the NDJSON response stream. Order: meta, places, request?, delta*, done. error may replace any step. */
export type StreamEvent =
  | { type: "meta"; intent: Intent; city: CitySlug | null }
  | { type: "places"; places: PlaceCard[] }
  | { type: "request"; prefill: RequestPrefill }
  | { type: "delta"; text: string }
  | { type: "done"; citedRefs: number[]; suggestions: string[] }
  | { type: "error"; code: ErrorCode; message: string };
