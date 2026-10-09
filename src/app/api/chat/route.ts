import OpenAI from "openai";
import { citedRefs } from "@/lib/citations";
import { CHAT_MODEL, getOpenAI } from "@/lib/clients";
import { planTurn } from "@/lib/planner";
import { buildContext, SYSTEM_PROMPT } from "@/lib/prompt";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { retrievePlaces, toCard } from "@/lib/retrieve";
import { buildSuggestions } from "@/lib/suggestions";
import type { ErrorCode, ErrorEnvelope, StreamEvent } from "@/lib/types";
import { parseChatRequest } from "@/lib/validate";

export const maxDuration = 60; // seconds; Vercel function ceiling for this route

const ANSWER_TIMEOUT_MS = 25_000;

function jsonError(status: number, code: ErrorCode, message: string): Response {
  const body: ErrorEnvelope = { error: { code, message } };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function classifyError(err: unknown): { code: ErrorCode; message: string } {
  if (err instanceof OpenAI.RateLimitError) {
    return { code: "upstream_rate_limited", message: "Pearl is very busy right now. Please try again in a minute." };
  }
  if (
    err instanceof OpenAI.APIConnectionTimeoutError ||
    err instanceof OpenAI.APIUserAbortError ||
    (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError"))
  ) {
    return { code: "upstream_timeout", message: "Pearl took too long to answer. Please try again." };
  }
  if (err instanceof OpenAI.APIError) {
    return { code: "upstream_error", message: "Pearl couldn't reach its language model. Please try again." };
  }
  return { code: "internal", message: "Something went wrong on our side. Please try again." };
}

export async function POST(req: Request): Promise<Response> {
  if (!allowRequest(clientIp(req))) {
    return jsonError(429, "rate_limited", "You're sending messages quickly. Please wait a minute and try again.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "bad_request", "Body must be valid JSON.");
  }
  const parsed = parseChatRequest(body);
  if (!parsed.ok) return jsonError(400, "bad_request", parsed.error);
  const { messages, city, shownPlaceIds } = parsed.value;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      const started = Date.now();
      try {
        // 1. Understand the turn: intent, city, filters, standalone search query.
        const plan = await planTurn(messages, city);
        send({ type: "meta", intent: plan.intent, city: plan.city });

        // 2. Retrieve candidates. Only "recommend" with a known city searches.
        const rows =
          plan.intent === "recommend" ? await retrievePlaces(plan, plan.wantsNewOptions ? shownPlaceIds : []) : [];
        const cards = rows.map((row, i) => toCard(row, i + 1));
        send({ type: "places", places: cards });

        // 3. Stream the answer, grounded in exactly those candidates.
        const completion = await getOpenAI().chat.completions.create(
          {
            model: CHAT_MODEL,
            stream: true,
            temperature: 0.3,
            max_completion_tokens: 500,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "system", content: buildContext(plan, rows) },
              ...messages.slice(-10),
            ],
          },
          { signal: AbortSignal.any([req.signal, AbortSignal.timeout(ANSWER_TIMEOUT_MS)]) },
        );
        let fullText = "";
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            fullText += text;
            send({ type: "delta", text });
          }
        }

        // 4. Report which candidates were actually cited, plus follow-up chips.
        const refs = citedRefs(fullText, cards.length);
        const cited = refs.map((ref) => cards[ref - 1]);
        send({ type: "done", citedRefs: refs, suggestions: buildSuggestions(plan, cited) });
        console.log(
          JSON.stringify({
            event: "turn_done",
            intent: plan.intent,
            city: plan.city,
            cited: refs.length,
            ms: Date.now() - started,
          }),
        );
      } catch (err) {
        console.error(JSON.stringify({ event: "turn_failed", error: String(err), ms: Date.now() - started }));
        if (!req.signal.aborted) send({ type: "error", ...classifyError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
