import { CITY_SLUGS } from "./catalog";
import { SERVICE_TYPES, type FieldError, type ServiceType } from "./i18n";
import type { CitySlug } from "./types";

// Shared by the request form (client) and /api/request (server), so both enforce the same rules.
// The database function create_concierge_request() checks them a third time.

export type RequestType = "venue" | "hotel_service";
export type RequestField = "service" | "city" | "date" | "time" | "partySize" | "name" | "email" | "notes";
export type FieldErrors = Partial<Record<RequestField, FieldError>>;

export const MAX_NAME = 100;
export const MAX_NOTES = 500;
export const MAX_PARTY = 20;

export interface RequestInput {
  requestType: RequestType;
  placeId: number | null; // venue requests only
  serviceType: ServiceType | null; // hotel service requests only
  city: CitySlug | null; // hotel service requests only; venue requests take the place's city
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  name: string;
  email: string;
  notes: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isRealDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Local calendar date as YYYY-MM-DD (for the form's min date). `offsetDays` may be negative. */
export function isoDate(offsetDays = 0, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offsetDays);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Returns field errors; an empty object means valid. `minDate` is the earliest allowed YYYY-MM-DD. */
export function validateRequest(input: RequestInput, minDate: string): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();

  if (input.requestType === "hotel_service") {
    if (!input.serviceType || !SERVICE_TYPES.includes(input.serviceType)) errors.service = "service";
    if (!input.city || !CITY_SLUGS.includes(input.city)) errors.city = "required";
  }
  if (!isRealDate(input.date)) errors.date = "date";
  else if (input.date < minDate) errors.date = "date";
  else if (input.date > isoDate(365, new Date(`${minDate}T12:00:00`))) errors.date = "date";
  if (!TIME.test(input.time)) errors.time = "time";
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > MAX_PARTY) {
    errors.partySize = "partySize";
  }
  if (!name) errors.name = "required";
  else if (name.length > MAX_NAME) errors.name = "tooLong";
  if (!email) errors.email = "required";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "email";
  if (input.notes.trim().length > MAX_NOTES) errors.notes = "tooLong";
  return errors;
}

/** Untrusted JSON body to RequestInput, or null when the shape is wrong. Field rules are checked separately. */
export function parseRequestBody(body: unknown): RequestInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const requestType = b.requestType;
  if (requestType !== "venue" && requestType !== "hotel_service") return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const placeId = typeof b.placeId === "number" && Number.isInteger(b.placeId) ? b.placeId : null;
  if (requestType === "venue" && placeId === null) return null;
  return {
    requestType,
    placeId: requestType === "venue" ? placeId : null,
    serviceType: requestType === "hotel_service" ? (str(b.serviceType) as ServiceType) || null : null,
    city: requestType === "hotel_service" ? (str(b.city) as CitySlug) || null : null,
    date: str(b.date),
    time: str(b.time),
    partySize: typeof b.partySize === "number" ? b.partySize : Number(str(b.partySize)),
    name: str(b.name),
    email: str(b.email),
    notes: str(b.notes),
  };
}
