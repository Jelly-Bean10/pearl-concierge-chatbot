import { CITY_SLUGS } from "./catalog";
import { parseLang } from "./i18n";
import type { ChatRequest, ChatTurn, CitySlug } from "./types";

export const MAX_USER_MESSAGE_CHARS = 500;
const MAX_HISTORY_CHARS = 2_000; // per older message; longer ones are truncated, not rejected
const MAX_TURNS_KEPT = 12;

type Result = { ok: true; value: ChatRequest } | { ok: false; error: string };

/** Hand-rolled validation for a three-field body. Trims history; rejects anything malformed. */
export function parseChatRequest(body: unknown): Result {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Body must be a JSON object." };
  const { messages, city, shownPlaceIds, lang } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "messages must be a non-empty array." };
  }
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    const role = (m as ChatTurn)?.role;
    const content = (m as ChatTurn)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return { ok: false, error: "Each message needs role 'user' or 'assistant' and string content." };
    }
    turns.push({ role, content: content.slice(0, MAX_HISTORY_CHARS) });
  }

  const last = messages[messages.length - 1] as ChatTurn;
  const lastText = last.content.trim();
  if (last.role !== "user" || lastText.length === 0) {
    return { ok: false, error: "The last message must be a non-empty user message." };
  }
  if (lastText.length > MAX_USER_MESSAGE_CHARS) {
    return { ok: false, error: `Message too long (max ${MAX_USER_MESSAGE_CHARS} characters).` };
  }
  turns[turns.length - 1] = { role: "user", content: lastText };

  if (city !== null && city !== undefined && !CITY_SLUGS.includes(city as CitySlug)) {
    return { ok: false, error: "city must be a supported city slug or null." };
  }
  const ids = Array.isArray(shownPlaceIds) ? shownPlaceIds.filter((n) => Number.isInteger(n)).slice(-100) : [];

  return {
    ok: true,
    value: {
      messages: turns.slice(-MAX_TURNS_KEPT),
      city: (city as CitySlug) ?? null,
      shownPlaceIds: ids as number[],
      lang: parseLang(lang),
    },
  };
}
