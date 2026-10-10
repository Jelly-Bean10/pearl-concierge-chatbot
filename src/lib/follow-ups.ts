import "server-only";
import { cityBySlug } from "./catalog";
import { CHAT_MODEL, getOpenAI } from "./clients";
import { LANGS, type Lang } from "./i18n";
import type { Plan } from "./planner";
import type { PlaceRow } from "./retrieve";

const FOLLOW_UP_TIMEOUT_MS = 6_000;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["chips"],
  properties: { chips: { type: "array", items: { type: "string" } } },
} as const;

/**
 * Three tappable next messages written for this conversation, e.g. "Natural wine after dinner nearby".
 * Runs alongside the answer stream, so it adds no wait. Returns null on any failure; the caller falls back
 * to the deterministic chips.
 */
export async function writeFollowUps(
  plan: Plan,
  rows: PlaceRow[],
  lastUserMessage: string,
  lang: Lang,
): Promise<string[] | null> {
  const city = cityBySlug(plan.city)?.name ?? "";
  const places = rows
    .slice(0, 4)
    .map(
      (r) =>
        `${r.name} (${r.category_label}${r.price_range ? `, ${r.price_range}` : ""}; ${r.tags.slice(0, 4).join(", ")})`,
    )
    .join("; ");
  const language = plan.userLanguage ?? LANGS.find((l) => l.code === lang)?.name ?? "English";
  try {
    const completion = await getOpenAI().chat.completions.create(
      {
        model: CHAT_MODEL,
        temperature: 0.7,
        max_completion_tokens: 120,
        response_format: { type: "json_schema", json_schema: { name: "chips", strict: true, schema: SCHEMA } },
        messages: [
          {
            role: "system",
            content: `A traveller in ${city} just asked a local guide: "${lastUserMessage}". The guide suggested: ${places}.
Write 3 short follow-up messages the traveller might tap next, in ${language}, each 2 to 6 words, written as the traveller would type them.
Make them specific to this request and city and go in different directions: one narrows or adjusts it (budget, mood, time, a neighbourhood), one is the natural next stop in the day or evening, one is an adjacent idea. No place names, no numbers or prices (say "cheaper" or "splurge"), no generic phrases like "show me more", "other options", "top attractions" or "tell me more". No question marks, no emoji, no em dashes.`,
          },
        ],
      },
      { signal: AbortSignal.timeout(FOLLOW_UP_TIMEOUT_MS) },
    );
    const chips: unknown = JSON.parse(completion.choices[0]?.message?.content ?? "{}").chips;
    if (!Array.isArray(chips)) return null;
    const clean = chips
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.replace(/[—?]/g, "").trim())
      .map((c) => c.charAt(0).toLocaleUpperCase() + c.slice(1))
      .filter((c) => c.length > 0 && c.length <= 48);
    return clean.length >= 2 ? clean.slice(0, 3) : null;
  } catch (err) {
    console.error(JSON.stringify({ event: "follow_ups_failed", error: String(err) }));
    return null;
  }
}
