# 05 · Design System

> As-built changes: the listings in this document are the original spec and the repo is canonical. Since then the UI gained a language selector in the header, all strings moved into `src/lib/i18n.ts` (components receive a `t` dictionary prop), RTL support (logical classes such as `ps-*`, `pe-*`, `start-*`, `text-start`; `<html dir>` set for Urdu), a "Request this" button on place cards, and an inline request form (`RequestForm.tsx`). Those are described in 11-CONCIERGE-AND-I18N. The request form reuses the existing tokens: `border-line` inputs, `bg-mist` notice, `bg-ink` primary button, `text-danger` errors, 44 px tall controls and 16 px text so iOS does not zoom.

## Direction

Pearl Club's site is warm and editorial: clean white pages, a light serif display face (Cormorant), a friendly sans for body (Karla), small uppercase monospace labels (Space Mono), near-black `#121113` pill tags in lowercase, a thin blue-to-red gradient accent, and flag emoji next to cities. The concierge borrows that vocabulary so it feels like part of pearlclub.com, without copying its code.

Principles:

1. **Editorial, not app-like.** Pearl's replies are not in a bubble; they read like a magazine paragraph under a small mono "PEARL" label. Only the user's messages are bubbles.
2. **Places are the hero.** Cards carry the photo, the curated summary, and one dominant action: "View on Pearl Club →".
3. **Phone first.** Every layout is designed at 390 px wide first, then widened to a 720 px reading column.
4. **Quiet chrome.** One accent (the gradient bar under the header). Everything else is ink on paper.

Reference screenshots of the finished UI (rendered from the exact code in this doc with mocked data) are in `docs/assets/`:

| File | Shows |
|---|---|
| `assets/mobile-welcome.png` | 390 × 844, welcome state |
| `assets/mobile-answer.png` | 390 × 844, streamed answer with citation buttons and cards |
| `assets/desktop-answer.png` | 1280 × 820, answer with citation buttons and three cards in the 720 px column |

The round "N" badge in the bottom-left corner of the screenshots is the Next.js dev-mode indicator, not part of the UI.

## Color tokens

Defined once in `src/app/globals.css` under `@theme`, used as Tailwind classes (`bg-ink`, `text-muted`, `border-line`, ...).

| Token | Hex | Use |
|---|---|---|
| `paper` | `#ffffff` | Page background, card background, composer |
| `mist` | `#f2f2f2` | Image placeholder, hover fill on chips and starter cards (Pearl Club's `--pearlclub-gray-150`) |
| `ink` | `#121113` | Text, user bubble, primary buttons, tag pills, selected city chip (Pearl Club's tag color) |
| `ink-soft` | `#3f3f46` | Secondary body text, card summaries, primary button hover |
| `muted` | `#71717a` | Mono labels, placeholders, hints (4.8:1 on white) |
| `line` | `#e4e4e7` | Borders, dividers |
| `accent-blue` | `#645cff` | Gradient start (Pearl Club `hsl(243 100% 68%)`) |
| `accent-red` | `#ff4d4f` | Gradient end (Pearl Club `hsl(359 100% 65%)`) |
| `accent-gold` | `#f5b429` | Reserved; not used in the MVP |
| `danger` | `#b42318` | Error text and error left border |
| `danger-bg` | `#fef3f2` | Error block background |

Gradient utility `pearl-gradient`: `linear-gradient(90deg, #645cff, #ff4d4f)`. Used only for the 3 px bar under the header.

## Typography

Loaded with `next/font/google` in `src/app/layout.tsx` and exposed as `font-display`, `font-sans` (default), `font-mono`.

| Role | Font | Size / line height | Weight | Extras | Where |
|---|---|---|---|---|---|
| Display | Cormorant | 34/38 mobile, 44/48 at `sm` | 500 | tracking -0.01em | Welcome headline |
| Wordmark | Cormorant | 22/22 | 600 | | Header "Pearl Club" |
| Card title | Cormorant | 22/26 | 600 | | Place name |
| Body | Karla | 16/26 | 400 | | Pearl's answers, welcome paragraph |
| User bubble | Karla | 15/24 | 400 | | User messages |
| Small | Karla | 14/20 | 400 or 500 | | Card summary, chips, hints |
| Label | Space Mono | 11/16 | 400 | uppercase, tracking 0.08em | "PEARL", "CITY", card meta line, footer note, secondary links |
| Button | Space Mono | 12/16 | 400 | uppercase, tracking 0.08em | "View on Pearl Club →" |
| Tag pill | Karla | 11/16 | 400 | lowercase, `#` prefix | Card tags |

The textarea is 16 px so iOS Safari does not zoom on focus.

## Spacing and layout

- Base unit 4 px (Tailwind default scale).
- Reading column: `max-w-[720px] mx-auto`, side padding `px-4` (16 px) on mobile and `sm:px-6` (24 px) from 640 px up.
- App shell: `h-dvh flex flex-col`: sticky header, a scrolling message area (`flex-1 overflow-y-auto`), then the composer. The page itself never scrolls horizontally.
- Vertical rhythm: 24 px (`gap-6`) between messages; 12 px (`gap-3`) inside a message.
- Radii: chips `rounded-full`; cards and starter cards `rounded-xl` (12 px); user bubble `rounded-2xl` with `rounded-br-md`; buttons inside cards `rounded-md`.
- Safe area: composer adds `pb-[env(safe-area-inset-bottom)]`; viewport uses `viewport-fit=cover`.

## Component anatomy

### App shell and header (`Header.tsx`)

```
┌──────────────────────────────────────────────┐
│ Pearl Club  CONCIERGE                NEW CHAT│  h-14, wordmark + mono tag; NEW CHAT only after first message
├══════════════ 3px blue→red gradient ═════════┤
│ CITY  (🇺🇸 New York City) (🇬🇧 London) (🇫🇷 …→ │  horizontal scroll, scrollbar hidden
└──────────────────────────────────────────────┘
```

- Sticky, `bg-paper/95 backdrop-blur`, bottom border `line`.
- City chips: `h-9 rounded-full border px-3.5 text-sm font-medium`, flag and name separated by `gap-1.5`. Selected: `bg-ink text-paper border-ink`. Unselected: `bg-paper text-ink border-line`, hover `border-ink`. `aria-pressed` reflects state. Tapping the selected chip clears it.
- The chip updates automatically when the server's `meta` event reports a city.

### Welcome / greeting and menu (`Welcome.tsx`)

Shown only before the first message.

```
HI, I'M PEARL                                  mono label
Where are you headed?                          display (adds " in London?" when a city is selected)
Ask me for places hand-picked by Pearl Club's local curators. Every suggestion
links to its Pearl Club guide. Pick a city above, or start with one of these.

┌ 💎 Find hidden gems ─────────┐ ┌ 🎟️ Book an experience ───────┐   1 column mobile, 2 columns at sm
│ Local favourites, off the    │ │ Tours, shows, classes and     │
│ tourist trail                │ │ culture                       │
└──────────────────────────────┘ └───────────────────────────────┘
┌ 🍽️ Dinner tonight ───────────┐ ┌ 🛏️ Where to stay ────────────┐
│ From neighbourhood spots to  │ │ Hotels with character         │
│ special nights               │ │                               │
└──────────────────────────────┘ └───────────────────────────────┘
```

Starter card: `rounded-xl border border-line p-4`, emoji 20 px, label Karla 15 bold, hint 14 muted; hover `border-ink bg-mist`.

Starter prompts sent on tap (`{inCity}` is ` in London` when a city is selected, otherwise empty):

| Card | Prompt sent |
|---|---|
| 💎 Find hidden gems | `Find me some hidden gems{inCity}` |
| 🎟️ Book an experience | `I want to book an experience{inCity}` |
| 🍽️ Dinner tonight | `Where should I have dinner tonight{inCity}?` |
| 🛏️ Where to stay | `Where should I stay{inCity}?` |

If no city is selected, the planner returns `need_city` and Pearl asks which city; the follow-up chips then offer "Hidden gems in New York City / London / Paris".

### User message

Right-aligned bubble, `max-w-[85%] rounded-2xl rounded-br-md bg-ink text-paper px-4 py-2.5`, `whitespace-pre-wrap`.

### Assistant message (`AssistantMessage.tsx`)

```
PEARL                                                     mono label
For an afternoon away from the crowds, Burgh House (1) is a calm Queen Anne
house in Hampstead ... Eltham Palace (2) mixes ... BFI IMAX (3) shows ...

Are you after something quiet, or a full day trip?

[card 01][card 02][card 03] →                             horizontal snap scroller
(Something cheaper) (Show me different options) (Somewhere good to eat nearby?)
```

- No bubble. Body text 16/26, `whitespace-pre-wrap` (so `- ` list lines from the model render as lines).
- Citation button: inline `h-5 min-w-5 rounded-full bg-ink text-paper font-mono text-[10px]`, nudged up 2 px, shows the ref number, scrolls its card into view. `aria-label` is "Show card N: Place name".
- Card row: `flex gap-3 overflow-x-auto snap-x snap-mandatory`, bleeds to the screen edge (`-mx-4 px-4`, `sm:-mx-6 sm:px-6`) with matching `scroll-px` so snapping aligns with the text column.
- Follow-up chips: only under the last assistant message once `done`; `h-9 rounded-full border border-line px-3.5 text-sm font-medium`, hover `border-ink bg-mist`; disabled while a reply is in progress.

### Place card (`PlaceCard.tsx`)

```
┌──────────────────────────┐   264 px wide on mobile, 216 px at sm (3 fit in 720 px)
│ 01                    $$ │   image 4:3, ref badge top-left (ink pill), price top-right (white pill)
│        [ photo ]         │   imgix: ?auto=format&fit=crop&w=600&h=450&q=70
├──────────────────────────┤
│ 🇬🇧 ARTS & CULTURE · LONDON│   mono label, muted
│ Burgh House              │   Cormorant 22 semibold, links to Pearl Club
│ Queen Anne mansion       │   summary, 14/20, ink-soft, clamped to 3 lines
│ serving as a ...         │
│ #architecture #garden    │   up to 3 tag pills (bg-ink, lowercase, 11 px)
│ ┌──────────────────────┐ │
│ │ VIEW ON PEARL CLUB → │ │   primary: h-10 bg-ink, mono uppercase, opens pearlclub.com in new tab
│ └──────────────────────┘ │
│    WEBSITE ↗    MAP ↗    │   secondary mono links, only if present
└──────────────────────────┘
```

- Whole card `rounded-xl border border-line bg-paper overflow-hidden flex flex-col`; the action block is pushed to the bottom (`mt-auto`) so buttons align across cards.
- Missing image: `bg-mist` box with the place's first letter in Cormorant 48 px, muted.
- Missing price: no price pill. Missing website or map: that link is omitted; if both are missing, the row is omitted.
- All links `target="_blank" rel="noopener noreferrer"`.
- "Website ↗" is how "Book an experience" works: the venue's own site.

### Composer (`Composer.tsx`)

```
┌───────────────────────────────────────────┬──┐
│ Ask Pearl for a place…                    │ ↑│   textarea grows 1 to 4 lines, round send button 40 px
└───────────────────────────────────────────┴──┘
ONLY PEARL CLUB CURATED PLACES                 412/500   counter appears past 400 characters
```

- Container `rounded-2xl border border-line`, `focus-within:border-ink`.
- Enter sends, Shift+Enter inserts a newline, IME composition is respected.
- `maxLength=500` (matches the API limit). Send is disabled while empty or while a reply is in progress; typing is still allowed.
- The label "Message Pearl" is visually hidden (`sr-only`).

## States

| State | What the user sees |
|---|---|
| Empty (first load) | Welcome section (above). No chat history. |
| Loading (after send, before first token) | Under "PEARL": three 6 px ink dots pulsing in sequence (`pearl-pulse` keyframes, 1.2 s, 0.15 s stagger) and the text "Searching Pearl Club's guides…" when the planner reported `recommend`, otherwise "Thinking…". `role="status"`, `aria-live="polite"`. |
| Streaming | Text grows; a half-received `[[` marker is hidden; cards appear as their markers arrive. |
| Done | Cards for cited places; follow-up chips under the last answer. |
| No match | Pearl's one-sentence "I don't have a curated pick for that in London yet" plus a suggestion; no cards; follow-up chips offer broader requests. |
| Unsupported city / need city | Short reply; chips offer supported cities. |
| Error | Red-bordered block: `rounded-lg border-l-4 border-danger bg-danger-bg px-4 py-3 text-sm text-danger`, the server's `message` (or "Couldn't reach Pearl. Check your connection and try again."), and an underlined "Try again" button on the last message. `role="alert"`. |
| Rate limited (429) | Same error block with "You're sending messages quickly. Please wait a minute and try again." |

## Copy

| Where | Text |
|---|---|
| Page title | `Ask Pearl · Pearl Club travel concierge` |
| Meta description | `Chat with Pearl to find places hand-picked by Pearl Club's local curators.` |
| Header | `Pearl Club` + `CONCIERGE`; `NEW CHAT` |
| City row label | `CITY` |
| Welcome label | `HI, I'M PEARL` |
| Welcome headline | `Where are you headed?` / `Where are you headed in {City}?` |
| Welcome body | `Ask me for places hand-picked by Pearl Club's local curators. Every suggestion links to its Pearl Club guide. Pick a city above, or start with one of these.` |
| Placeholder | `Ask Pearl for a place…` |
| Footer note | `ONLY PEARL CLUB CURATED PLACES` |
| Card CTA | `VIEW ON PEARL CLUB →`, `WEBSITE ↗`, `MAP ↗` |
| Loading | `Searching Pearl Club's guides…` / `Thinking…` |
| Network error | `Couldn't reach Pearl. Check your connection and try again.` |
| Retry | `Try again` |

## Code

All of the following compiled, linted, and rendered as shown in `docs/assets/`. Copy verbatim.

### `src/app/globals.css`

```css
@import "tailwindcss";

/* Pearl Club-inspired tokens. Light theme only (Pearl Club itself is light only). */
@theme {
  --color-paper: #ffffff;
  --color-mist: #f2f2f2;
  --color-ink: #121113;
  --color-ink-soft: #3f3f46;
  --color-muted: #71717a;
  --color-line: #e4e4e7;
  --color-accent-blue: #645cff;
  --color-accent-red: #ff4d4f;
  --color-accent-gold: #f5b429;
  --color-danger: #b42318;
  --color-danger-bg: #fef3f2;

  --font-display: var(--font-cormorant), ui-serif, Georgia, serif;
  --font-sans: var(--font-karla), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-space-mono), ui-monospace, monospace;
}

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
  }
  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-sans);
  }
}

@utility pearl-gradient {
  background: linear-gradient(90deg, var(--color-accent-blue), var(--color-accent-red));
}

@utility no-scrollbar {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

@keyframes pearl-pulse {
  0%,
  80%,
  100% {
    opacity: 0.25;
  }
  40% {
    opacity: 1;
  }
}
```

### `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from "next";
import { Cormorant, Karla, Space_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant" });
const karla = Karla({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-karla" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

export const metadata: Metadata = {
  title: "Ask Pearl · Pearl Club travel concierge",
  description: "Chat with Pearl to find places hand-picked by Pearl Club's local curators.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${karla.variable} ${spaceMono.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
```

### `src/app/page.tsx`

```tsx
import Chat from "@/components/Chat";

export default function Home() {
  return <Chat />;
}
```

### `src/components/Chat.tsx`

Owns all state: messages, selected city, busy flag. Sends history with markers stripped, reads the NDJSON stream, patches the in-progress assistant message per event, and handles retry.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { citedRefs, stripMarkers } from "@/lib/citations";
import { readEvents } from "@/lib/read-stream";
import type { ChatTurn, CitySlug, ErrorEnvelope, Intent, PlaceCard } from "@/lib/types";
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
  error?: string;
}

const NETWORK_ERROR = "Couldn't reach Pearl. Check your connection and try again.";

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
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

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
        body: JSON.stringify({ messages: toHistory([...base, user]), city, shownPlaceIds: shownPlaceIds(base) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as ErrorEnvelope | null;
        patch(reply.id, () => ({ status: "error", error: body?.error.message ?? NETWORK_ERROR }));
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
          patch(reply.id, () => ({ status: "error", error: event.message }));
        }
      }
    } catch {
      patch(reply.id, () => ({ status: "error", error: NETWORK_ERROR }));
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

  return (
    <div className="flex h-dvh flex-col">
      <Header city={city} onCity={setCity} onReset={messages.length > 0 ? reset : undefined} />

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <Welcome city={city} onPick={(t) => void send(t)} />
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
                  message={m}
                  isLast={m.id === last?.id}
                  busy={busy}
                  onSuggestion={(t) => void send(t)}
                  onRetry={() => retry(m.id)}
                />
              ),
            )
          )}
        </div>
      </div>

      <Composer busy={busy} onSend={(t) => void send(t)} />
    </div>
  );
}
```

### `src/components/AssistantMessage.tsx`

```tsx
import { toSegments } from "@/lib/citations";
import type { UIMessage } from "./Chat";
import PlaceCard from "./PlaceCard";

interface Props {
  message: UIMessage;
  isLast: boolean;
  busy: boolean;
  onSuggestion: (text: string) => void;
  onRetry: () => void;
}

export default function AssistantMessage({ message, isLast, busy, onSuggestion, onRetry }: Props) {
  const validRefs = new Set(message.places.map((p) => p.ref));
  const cited = message.citedRefs.map((ref) => message.places[ref - 1]).filter(Boolean);

  function scrollToCard(ref: number) {
    document
      .getElementById(`card-${message.id}-${ref}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Pearl</p>

      {message.status === "pending" && (
        <div className="flex items-center gap-3 text-sm text-muted" role="status" aria-live="polite">
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-ink"
                style={{ animation: `pearl-pulse 1.2s ${i * 0.15}s infinite ease-in-out` }}
              />
            ))}
          </span>
          {message.intent === "recommend" ? "Searching Pearl Club's guides…" : "Thinking…"}
        </div>
      )}

      {message.text && (
        <div className="whitespace-pre-wrap text-base leading-[26px] text-ink">
          {toSegments(message.text, validRefs).map((s, i) =>
            s.kind === "text" ? (
              <span key={i}>{s.text}</span>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => scrollToCard(s.ref)}
                className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 align-[2px] font-mono text-[10px] text-paper hover:bg-ink-soft"
                aria-label={`Show card ${s.ref}: ${message.places[s.ref - 1]?.name ?? ""}`}
              >
                {s.ref}
              </button>
            ),
          )}
        </div>
      )}

      {cited.length > 0 && (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {cited.map((place) => (
            <PlaceCard key={place.id} place={place} domId={`card-${message.id}-${place.ref}`} />
          ))}
        </div>
      )}

      {message.status === "error" && (
        <div className="rounded-lg border-l-4 border-danger bg-danger-bg px-4 py-3 text-sm text-danger" role="alert">
          <p>{message.error}</p>
          {isLast && (
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="mt-1 font-medium underline underline-offset-2"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {isLast && message.status === "done" && message.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {message.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => onSuggestion(s)}
              className="h-9 rounded-full border border-line px-3.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-mist disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### `src/components/PlaceCard.tsx`

```tsx
import type { PlaceCard as Place } from "@/lib/types";

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function PlaceCard({ place, domId }: { place: Place; domId: string }) {
  return (
    <article
      id={domId}
      className="flex w-[264px] shrink-0 snap-start sm:w-[216px] flex-col overflow-hidden rounded-xl border border-line bg-paper"
    >
      <a href={place.url} {...external} className="relative block aspect-[4/3] bg-mist" tabIndex={-1} aria-hidden>
        {place.imageUrl ? (
          // Plain <img>: the CDN (imgix) already resizes; next/image would add config for no gain.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-5xl text-muted">
            {place.name[0]}
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] text-paper">
          {String(place.ref).padStart(2, "0")}
        </span>
        {place.priceRange && (
          <span className="absolute right-2 top-2 rounded-md bg-paper/90 px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink">
            {place.priceRange}
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {place.countryFlag} {place.categoryLabel} · {place.cityName}
        </p>
        <h3 className="font-display text-[22px] font-semibold leading-[26px] text-ink">
          <a href={place.url} {...external} className="hover:underline">
            {place.name}
          </a>
        </h3>
        <p className="line-clamp-3 text-sm leading-5 text-ink-soft">{place.summary}</p>
        {place.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {place.tags.map((tag) => (
              <li key={tag} className="rounded-xl bg-ink px-2 py-0.5 text-[11px] lowercase text-paper">
                #{tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <a
            href={place.url}
            {...external}
            className="flex h-10 items-center justify-center rounded-md bg-ink font-mono text-xs uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink-soft"
          >
            View on Pearl Club →
          </a>
          {(place.websiteUrl || place.mapUrl) && (
            <div className="flex justify-center gap-5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {place.websiteUrl && (
                <a href={place.websiteUrl} {...external} className="hover:text-ink">
                  Website ↗
                </a>
              )}
              {place.mapUrl && (
                <a href={place.mapUrl} {...external} className="hover:text-ink">
                  Map ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
```

### `src/components/Header.tsx`

```tsx
import { CITIES } from "@/lib/catalog";
import type { CitySlug } from "@/lib/types";

interface Props {
  city: CitySlug | null;
  onCity: (city: CitySlug | null) => void;
  onReset?: () => void;
}

export default function Header({ city, onCity, onReset }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[720px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[22px] font-semibold leading-none text-ink">Pearl Club</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Concierge</span>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted hover:text-ink"
          >
            New chat
          </button>
        )}
      </div>
      <div className="pearl-gradient h-[3px]" aria-hidden />
      <nav aria-label="City" className="mx-auto w-full max-w-[720px]">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">City</span>
          {CITIES.map((c) => {
            const active = c.slug === city;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={active}
                onClick={() => onCity(active ? null : c.slug)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  active ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink"
                }`}
              >
                <span aria-hidden>{c.flag}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
```

### `src/components/Welcome.tsx`

```tsx
import { cityBySlug } from "@/lib/catalog";
import type { CitySlug } from "@/lib/types";

interface Props {
  city: CitySlug | null;
  onPick: (prompt: string) => void;
}

export default function Welcome({ city, onPick }: Props) {
  const name = cityBySlug(city)?.name;
  const inCity = name ? ` in ${name}` : "";
  const starters = [
    {
      emoji: "💎",
      label: "Find hidden gems",
      hint: "Local favourites, off the tourist trail",
      prompt: `Find me some hidden gems${inCity}`,
    },
    {
      emoji: "🎟️",
      label: "Book an experience",
      hint: "Tours, shows, classes and culture",
      prompt: `I want to book an experience${inCity}`,
    },
    {
      emoji: "🍽️",
      label: "Dinner tonight",
      hint: "From neighbourhood spots to special nights",
      prompt: `Where should I have dinner tonight${inCity}?`,
    },
    { emoji: "🛏️", label: "Where to stay", hint: "Hotels with character", prompt: `Where should I stay${inCity}?` },
  ];

  return (
    <section className="flex flex-col gap-8 pt-4 sm:pt-10">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Hi, I&apos;m Pearl</p>
        <h1 className="font-display text-[34px] font-medium leading-[38px] tracking-[-0.01em] text-ink sm:text-[44px] sm:leading-[48px]">
          Where are you headed{name ? ` in ${name}` : ""}?
        </h1>
        <p className="max-w-[52ch] text-base leading-[26px] text-ink-soft">
          Ask me for places hand-picked by Pearl Club&apos;s local curators. Every suggestion links to its Pearl Club
          guide. Pick a city above, or start with one of these.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 text-left transition-colors hover:border-ink hover:bg-mist"
          >
            <span className="text-xl leading-6" aria-hidden>
              {s.emoji}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold leading-6 text-ink">{s.label}</span>
              <span className="text-sm leading-5 text-muted">{s.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

### `src/components/Composer.tsx`

```tsx
"use client";

import { useRef, useState } from "react";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/validate";

export default function Composer({ busy, onSend }: { busy: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = !busy && text.trim().length > 0;

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 4 * 24 + 20)}px`; // up to 4 lines
  }

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText("");
    requestAnimationFrame(resize);
  }

  return (
    <div className="border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
      <form
        className="mx-auto flex w-full max-w-[720px] flex-col gap-1.5 px-4 pb-3 pt-3 sm:px-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-paper py-1.5 pl-4 pr-1.5 focus-within:border-ink">
          <label htmlFor="message" className="sr-only">
            Message Pearl
          </label>
          <textarea
            id="message"
            ref={ref}
            rows={1}
            value={text}
            maxLength={MAX_USER_MESSAGE_CHARS}
            placeholder="Ask Pearl for a place…"
            onChange={(e) => {
              setText(e.target.value);
              resize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-[116px] flex-1 resize-none bg-transparent py-2 text-base leading-6 text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          <span>Only Pearl Club curated places</span>
          {text.length > MAX_USER_MESSAGE_CHARS - 100 && (
            <span>
              {text.length}/{MAX_USER_MESSAGE_CHARS}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
```

## Accessibility checklist

- Every interactive element is a real `<button>` or `<a>`; focus outlines are not removed except the textarea, whose container shows `focus-within:border-ink`.
- City chips use `aria-pressed`; the city row is a `<nav aria-label="City">`.
- Loading uses `role="status"`; errors use `role="alert"`.
- Card images are decorative (`alt=""`, image link `aria-hidden` and `tabIndex={-1}`); the title link carries the name.
- Text contrast: ink on paper 19:1, muted on paper 4.8:1, paper on ink 19:1.
