# 11 · Multilingual support and concierge requests

This document describes two features added after the first MVP: a language selector with replies in the user's language, and an honest request flow for venue and hotel service requests. The source files in the repo are canonical; where the long code listings in 04 and 05 differ, this document and the repo win.

## 1. Multilingual support

Languages: English, Spanish, French, German, Japanese, Urdu (right to left).

### What is translated and what is not

| Translated | Never translated |
|---|---|
| Welcome text, four starter cards (label, hint, prompt), composer placeholder and footer | Place names |
| Loading, thinking, retry and every error message | Addresses and neighbourhood names |
| Card labels (category names, "View on Pearl Club", "Website", "Map", "Request this") | Each venue's own description and summary |
| The whole request form, its validation messages and the confirmation text | Tags (they are venue vocabulary) |
| Follow-up chips | |
| Pearl's replies | |

All UI strings live in one typed dictionary, `src/lib/i18n.ts` (`Dict`). TypeScript fails the build if any language is missing a key. Server code that needs strings (follow-up chips) uses the same dictionary.

### Choosing the language

`src/lib/use-lang.ts` resolves the language in this order: the user's explicit choice (stored in `localStorage` as `pearl-lang`), then `navigator.language`, then English. It is built on `useSyncExternalStore` so server and first client render agree (English) and there is no hydration mismatch.

`Chat.tsx` mirrors the language to `<html lang>` and `<html dir>`. Urdu sets `dir="rtl"`. Components use logical Tailwind classes (`ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) so layout mirrors with no per-language CSS. A `:lang(ur)` rule swaps the font to Noto Naskh Arabic.

### How replies follow the user's language

The browser sends `lang` (the selected UI language) with every `/api/chat` request. The planner call also returns `user_language`, the language the latest message is actually written in. The answer prompt's `Reply language` line uses `user_language` when present and the UI language otherwise. So:

- A Spanish UI with a Spanish message gets a Spanish reply.
- A Spanish UI where the user types English gets an English reply. If they switch language mid-conversation, Pearl follows them.
- A one-word message ("Paris") is too short to tell, so the UI language is used.

### Cross-lingual retrieval

The place database is English, so embeddings are English. The planner is instructed to write `search_query` in English whatever language the user wrote in, keeping proper nouns unchanged ("café acogedor para leer" becomes "cozy cafe to read in"). Retrieval therefore behaves the same in every language. The planner also maps city names in any language ("París", "東京", "پیرس") to the city slug.

### Tests

`npm run eval` includes Spanish, French, German, Japanese and Urdu cases. Each checks the detected city, that at least two of the top four candidates are in the expected categories (proof that cross-lingual retrieval works), and that the reply contains the language's characteristic words or script. One case uses a Spanish UI with an English message and expects an English reply.

## 2. Concierge and hotel service requests

### Why this is a request flow and not booking

Pearl Club is a discovery guide. It has no reservation system, no inventory, and no connection to any venue's booking software. A real reservation needs a venue-side system that can accept or refuse it. Pretending otherwise would mean telling travellers they have a table that nobody has promised them. So this feature logs a request, tells the user plainly that nothing is confirmed, and leaves the confirmation to the venue or hotel desk. Every surface says this: the form notice, the confirmation message, and the system prompt, which forbids the words booked, reserved, confirmed and guaranteed for anything Pearl did.

### Two request types

| | Venue request | Hotel service request |
|---|---|---|
| Tied to a place | Yes. Prefilled from a card, or from a venue named in chat | No |
| User picks | Date, time, party size | Service (spa, late checkout, airport transfer, restaurant reservation, other), city, date, time, party size |
| `request_type` in the table | `venue` | `hotel_service` |
| Needs | `place_id` | `service_type` and `city` |

There are no demo hotels or fictional properties. A hotel service request is a request to a hotel desk in a chosen city, nothing more.

### Entry points

1. **"Request this" button on every place card.** Adds a local assistant message holding the form, prefilled with that place. No model call.
2. **"Book an experience" starter.** Its prompt goes through the planner as `request_venue` with no named place, so Pearl recommends experiences and tells the user to tap "Request this" on a card.
3. **Natural language.** The planner recognises booking intent in any supported language:
   - "Can you book me a table at 34 Mayfair in London for Friday at 8pm for 4?" becomes `request_venue`. The route searches for the named place, and if one of the retrieved candidates matches the name (accent and case insensitive), it emits a `request` stream event and the form opens prefilled with place, date, time and party size.
   - If the named venue is not in the Pearl Club corpus, no form opens. Pearl says it has no curated entry and recommends close fits, each with a "Request this" button.
   - "I need a late checkout on Sunday" becomes `request_hotel`. The form opens with the service and date prefilled.

The planner is given today's date so "Friday" and "tomorrow" resolve to real dates.

### Stream event

`/api/chat` emits one extra NDJSON event, after `places` and before the first `delta`:

```json
{"type":"request","prefill":{"kind":"venue","placeRef":1,"serviceType":null,"city":"london","date":"2026-10-16","time":"20:00","partySize":4}}
```

`placeRef` is a 1-based index into the same turn's `places` event. The matched place is always added to the cited cards, so the form's place is visible on screen.

### The form

`src/components/RequestForm.tsx`, rendered inline inside the assistant message (no separate page). Fields: request type (read-only badge), place (venue) or service and city (hotel), date, time, party size, name, email, notes (optional). Native date and time inputs keep it usable on a phone.

States: open, sending (button disabled), field errors (localized, focus moves to the first invalid field), submit failure (red alert, form stays filled), logged (confirmation), cancelled.

Confirmation text is deterministic and localized, not model-written: "Request logged. Not confirmed. Your request for X is logged (ref #N). It would be passed to the venue or hotel desk, but this is not a confirmed reservation. Nothing is booked until they confirm with you directly."

### Validation, three layers

The same rules run in three places so none depends on the others:

1. **Client**: `validateRequest()` in `src/lib/request-validate.ts` (shared module) before submitting.
2. **Server**: `POST /api/request` runs the same function, then returns `400` with `error.fields` mapping field names to error codes that the client turns into localized text.
3. **Database**: `create_concierge_request()` and the table constraints (section 4).

Rules: date is a real calendar date from today (yesterday is accepted on the server to tolerate time zones) to one year ahead; time is `HH:MM`; party size is an integer 1 to 20; name 1 to 100 characters; email matches a basic address pattern and is at most 254 characters; notes at most 500 characters; hotel requests need a known service and a supported city; venue requests need an existing `place_id`.

### API: `POST /api/request`

Request body:

```json
{"requestType":"venue","placeId":8,"serviceType":null,"city":null,"date":"2026-10-12","time":"19:30","partySize":2,"name":"A Traveller","email":"a@example.com","notes":""}
```

Responses:

| Status | Body | When |
|---|---|---|
| 200 | `{"ok":true,"id":42}` | Logged |
| 400 | `{"error":{"code":"bad_request","message":"...","fields":{"email":"email"}}}` | Invalid input |
| 429 | `{"error":{"code":"rate_limited",...}}` | More than 10 requests in 10 minutes from one IP (separate counter from chat) |
| 500 | `{"error":{"code":"internal",...}}` | Database failure |

### Email

Not built. The stored record plus the in-chat confirmation is the deliverable. Sending mail would also mean implying a human reads it. When a real hand-off exists (a venue desk inbox, a webhook), add it as an insert trigger or a worker that reads `concierge_requests`.

## 3. Security design

- The app uses the Supabase **publishable** key only. It can call exactly two functions: `match_places()` (read-only, max 20 rows, data already public) and `create_concierge_request()` (insert only, validates everything, returns only the new id).
- `places` and `concierge_requests` both have RLS enabled with no policies, so neither can be read or written through the API directly. A visitor cannot list other people's requests, which contain names and emails.
- Both functions are `security definer` with a pinned `search_path`, `execute` revoked from `public` and granted to `anon`, `authenticated` and `service_role`.
- Reading requests is done by the team in the Supabase dashboard or with the service role. There is deliberately no read endpoint.
- Personal data is never logged: `/api/request` logs only the new id and the request type.

## 4. Table

The full DDL is in 03-DATA-PIPELINE section 6b and in `supabase/migrations/20261010000100_concierge_requests.sql`.
