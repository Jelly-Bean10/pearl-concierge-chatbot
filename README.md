# Ask Pearl · Pearl Club travel concierge (MVP)

**Live demo:** https://pearl-concierge.vercel.app

A mobile-first chat assistant that recommends places hand-picked by Pearl Club's local curators. Pick a city, ask for anything from hidden gems to dinner tonight, and Pearl answers in a few sentences with cards for real Pearl Club places, each linking to its pearlclub.com page. It never invents a place: answers are grounded in 1,785 places scraped from pearlclub.com (with the founder's permission) for New York City, London, Paris, and Los Angeles.

## How it works

```
message ─► plan (intent, city, filters, search phrase) ─► vector search in Postgres ─► streamed answer citing [[n]] ─► cards
```

- `scraper/scrape.py` reads Pearl Club's sitemaps and each place page's JSON-LD, writes `data/places.jsonl`.
- `scraper/load.py` embeds each place once and upserts it into Supabase (pgvector).
- `src/app/api/chat/route.ts` plans the turn, retrieves candidates with `match_places`, and streams an answer that may only mention those candidates, as NDJSON.
- `src/components/` renders the chat, citation buttons, and place cards.

Full design and specs: [`docs/`](docs/00-OVERVIEW.md).

## Run locally

Requirements: Node 22+, Python 3.11+, a Supabase project, an OpenAI API key.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill `.env.local` (see [`docs/10-DEPLOYMENT.md`](docs/10-DEPLOYMENT.md#1-environment-variables)), run the SQL in `supabase/migrations/` once in the Supabase SQL editor, then seed:

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

In: chat, grounded recommendations, place cards, city context, follow-up suggestions, mobile layout.
Out: booking, accounts, saved history, maps, multilingual UI, products, other cities. See [`docs/00-OVERVIEW.md`](docs/00-OVERVIEW.md#explicit-non-goals).
