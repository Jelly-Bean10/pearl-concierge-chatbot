import { getSupabase } from "@/lib/clients";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { isoDate, parseRequestBody, validateRequest, type FieldErrors } from "@/lib/request-validate";
import type { ErrorCode, ErrorEnvelope } from "@/lib/types";

const MAX_PER_WINDOW = 10; // requests per 10 minutes per IP, separate from the chat limit

function jsonError(status: number, code: ErrorCode, message: string, fields?: FieldErrors): Response {
  const body: ErrorEnvelope = { error: { code, message, ...(fields ? { fields } : {}) } };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Log a concierge request. This is NOT a booking: it only records the request for a human to follow up.
 * The database function re-validates everything and returns the new row id.
 */
export async function POST(req: Request): Promise<Response> {
  if (!allowRequest(clientIp(req), "request", MAX_PER_WINDOW)) {
    return jsonError(429, "rate_limited", "Too many requests. Please wait a few minutes and try again.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "bad_request", "Body must be valid JSON.");
  }
  const input = parseRequestBody(body);
  if (!input) return jsonError(400, "bad_request", "Invalid request.");

  // Yesterday as the floor, so a traveller ahead of the server's clock can still request "today".
  const fields = validateRequest(input, isoDate(-1, new Date()));
  if (Object.keys(fields).length > 0) {
    return jsonError(400, "bad_request", "Please check the highlighted fields.", fields);
  }

  const { data, error } = await getSupabase().rpc("create_concierge_request", {
    p_request_type: input.requestType,
    p_place_id: input.placeId,
    p_service_type: input.serviceType,
    p_city: input.city,
    p_date: input.date,
    p_time: input.time,
    p_party_size: input.partySize,
    p_name: input.name.trim(),
    p_email: input.email.trim(),
    p_notes: input.notes.trim() || null,
  });
  if (error) {
    console.error(JSON.stringify({ event: "request_failed", code: error.code, error: error.message }));
    if (error.code === "22023") return jsonError(400, "bad_request", "Invalid request.");
    return jsonError(500, "internal", "We couldn't log your request. Please try again.");
  }

  console.log(JSON.stringify({ event: "request_logged", id: data, type: input.requestType }));
  return Response.json({ ok: true, id: data as number }, { headers: { "Cache-Control": "no-store" } });
}
