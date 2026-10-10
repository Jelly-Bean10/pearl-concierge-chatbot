# Ask Pearl · Pearl Club travel concierge (MVP)

**Live demo:** https://pearl-concierge.vercel.app

A mobile-first chat assistant that recommends places hand-picked by Pearl Club's local curators. Pick a city, ask for anything from hidden gems to dinner tonight, and Pearl answers in a few sentences with cards for real Pearl Club places, each linking to its pearlclub.com page. It never invents a place: answers are grounded in 3,375 places scraped from pearlclub.com (with the founder's permission) across 12 cities: New York City, London, Paris, Los Angeles, Berlin, San Francisco, Austin, Barcelona, Amsterdam, Lisbon, Tokyo and Miami. It speaks English, Spanish, French, German, Japanese and Urdu, and can log concierge and hotel service requests (it cannot make real bookings; see below).

## How it works

```
message ─► plan (intent, city, filters, search phrase) ─► vector search in Postgres ─► streamed answer citing [[n]] ─► cards
```

- `scraper/scrape.py` reads Pearl Club's sitemaps and each place page's JSON-LD, writes `data/places.jsonl`.
- `scraper/load.py` embeds each place once and upserts it into Supabase (pgvector).
- `src/app/api/chat/route.ts` plans the turn, retrieves candidates with `match_places`, and streams an answer that may only mention those candidates, as NDJSON.
- `src/app/api/request/route.ts` logs a concierge request through a validating database function. This is a request, not a booking: real reservations need a venue-side system, so Pearl says plainly that nothing is confirmed.
- `src/lib/i18n.ts` holds every UI string in six languages; the planner translates the search phrase to English so retrieval works in any language.
- `src/components/` renders the chat, citation buttons, place cards, and the inline request form.

Full design and specs: [`docs/`](docs/00-OVERVIEW.md).

## Run locally

Requirements: Node 22+, Python 3.11+, a Supabase project, an OpenAI API key.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill `.env.local` (see [`docs/10-DEPLOYMENT.md`](docs/10-DEPLOYMENT.md#1-environment-variables)), run both SQL files in `supabase/migrations/` once in the Supabase SQL editor (places, then concierge requests), then seed:

```bash
python3 -m venv scraper/.venv && scraper/.venv/bin/pip install -r scraper/requirements.txt
```

```bash
scraper/.venv/bin/python scraper/scrape.py
```

```bash
scraper/.venv/bin/python scraper/load.py
```

Start the app at http://localhost:3000:

```bash
npm run dev
```

Checks:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run build
```

```bash
npm run eval
```

## Deploy

Import the repo into Vercel, set `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY` (publishable) for Production and Preview, and deploy `main`. Share the production domain (`https://<project>.vercel.app`), which is public; deployment-specific URLs are behind Vercel login by default. Details in [`docs/10-DEPLOYMENT.md`](docs/10-DEPLOYMENT.md).

## Scope

In: chat, grounded recommendations, place cards, city context, follow-up suggestions, mobile layout, six languages, concierge and hotel service requests (logged, never confirmed).
Out: real booking and payments, email hand-off, accounts, saved history, map views, fictional demo hotels, products, other cities. See [`docs/00-OVERVIEW.md`](docs/00-OVERVIEW.md#explicit-non-goals) and [`docs/11-CONCIERGE-AND-I18N.md`](docs/11-CONCIERGE-AND-I18N.md).
