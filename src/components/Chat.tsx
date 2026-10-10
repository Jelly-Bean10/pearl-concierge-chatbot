"use client";

import { useEffect, useRef, useState } from "react";
import { citedRefs, stripMarkers } from "@/lib/citations";
import { LANGS, t as dict } from "@/lib/i18n";
import { readEvents } from "@/lib/read-stream";
import { useLang } from "@/lib/use-lang";
import type { ChatTurn, CitySlug, ErrorCode, ErrorEnvelope, Intent, PlaceCard } from "@/lib/types";
import AssistantMessage from "./AssistantMessage";
import Composer from "./Composer";
import Header from "./Header";
import Welcome from "./Welcome";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  status: "pending" | "streaming" | "done" | "error";
  intent?: Intent;
  places: PlaceCard[];
  citedRefs: number[];
  suggestions: string[];
  error?: ErrorCode | "network";
}

function newId() {
  return Math.random().toString(36).slice(2);
}

/** Places that were shown as cards, in order, for the "show me different options" exclusion. */
function shownPlaceIds(messages: UIMessage[]): number[] {
  return messages.flatMap((m) => m.citedRefs.map((ref) => m.places[ref - 1]?.id)).filter((id) => id !== undefined);
}

/** Conversation history for the API: successful turns only, markers stripped from assistant text. */
function toHistory(messages: UIMessage[]): ChatTurn[] {
  return messages
    .filter((m) => m.role === "user" || m.status === "done")
    .map((m) => ({ role: m.role, content: m.role === "assistant" ? stripMarkers(m.text) : m.text }));
}

export default function Chat() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [city, setCity] = useState<CitySlug | null>(null);
  const [lang, changeLang] = useLang();
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Mirror language and direction on <html> so fonts, hyphenation and RTL layout follow.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGS.find((l) => l.code === lang)?.rtl ? "rtl" : "ltr";
  }, [lang]);

  // Keep the newest content in view unless the user has scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  function patch(id: string, update: (m: UIMessage) => Partial<UIMessage>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...update(m) } : m)));
  }

  async function send(text: string, base: UIMessage[] = messages) {
    const content = text.trim();
    if (!content || busy) return;
    const user: UIMessage = {
      id: newId(),
      role: "user",
      text: content,
      status: "done",
      places: [],
      citedRefs: [],
      suggestions: [],
    };
    const reply: UIMessage = {
      id: newId(),
      role: "assistant",
      text: "",
      status: "pending",
      places: [],
      citedRefs: [],
      suggestions: [],
    };
    setMessages([...base, user, reply]);
    setBusy(true);
    stickToBottom.current = true;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toHistory([...base, user]), city, shownPlaceIds: shownPlaceIds(base), lang }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as ErrorEnvelope | null;
        patch(reply.id, () => ({ status: "error", error: body?.error.code ?? "network" }));
        return;
      }
      for await (const event of readEvents(res)) {
        if (event.type === "meta") {
          patch(reply.id, () => ({ intent: event.intent }));
          if (event.city) setCity(event.city);
        } else if (event.type === "places") {
          patch(reply.id, () => ({ places: event.places }));
        } else if (event.type === "delta") {
          patch(reply.id, (m) => {
            const next = m.text + event.text;
            return { status: "streaming", text: next, citedRefs: citedRefs(next, m.places.length) };
          });
        } else if (event.type === "done") {
          patch(reply.id, () => ({ status: "done", citedRefs: event.citedRefs, suggestions: event.suggestions }));
        } else if (event.type === "error") {
          patch(reply.id, () => ({ status: "error", error: event.code }));
        }
      }
    } catch {
      patch(reply.id, () => ({ status: "error", error: "network" }));
    } finally {
      setBusy(false);
    }
  }

  /** Drop the failed exchange and resend the same user text. */
  function retry(failedId: string) {
    const index = messages.findIndex((m) => m.id === failedId);
    const userText = messages[index - 1]?.text;
    if (index < 1 || !userText) return;
    void send(userText, messages.slice(0, index - 1));
  }

  function reset() {
    if (busy) return;
    setMessages([]);
    setCity(null);
  }

  const last = messages[messages.length - 1];
  const t = dict(lang);

  return (
    <div className="flex h-dvh flex-col">
      <Header
        t={t}
        lang={lang}
        onLang={changeLang}
        city={city}
        onCity={setCity}
        onReset={messages.length > 0 ? reset : undefined}
      />

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <Welcome t={t} city={city} onPick={(text) => void send(text)} />
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-6 text-paper">
                    {m.text}
                  </p>
                </div>
              ) : (
                <AssistantMessage
                  key={m.id}
                  t={t}
                  message={m}
                  isLast={m.id === last?.id}
                  busy={busy}
                  onSuggestion={(text) => void send(text)}
                  onRetry={() => retry(m.id)}
                />
              ),
            )
          )}
        </div>
      </div>

      <Composer t={t} busy={busy} onSend={(text) => void send(text)} />
    </div>
  );
}
