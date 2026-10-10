# Ask Pearl

A chat assistant for [Pearl Club](https://www.pearlclub.com). Pick a city, ask for something, and Pearl answers with cards for real Pearl Club places that link back to their pages.

**Live:** https://pearl-concierge.vercel.app

Built as a short test project. It covers 12 cities (3,375 places), six languages (English, Spanish, French, German, Japanese, Urdu), and logs concierge requests for venues and hotel services.

## How it works

One request to `/api/chat` does three things:

1. **Plan.** A small structured-output call turns the message and recent history into an intent, a city, filters, and an English search phrase. This is what makes "something cheaper", "coffee in Brooklyn" and non-English messages work.
2. **Retrieve.** The phrase is embedded and matched against the places table in Postgres (pgvector), filtered by city.
3. **Answer.** The reply is streamed, and the model may only mention the retrieved places. Each mention carries a `[[n]]` marker, and the cards shown are built from database rows for those markers only. A place the model names without a marker never gets a card, and an unknown marker is dropped. In the reply, a cited name becomes a link that scrolls to its card.

While the answer streams, a second small call writes three follow-up suggestions for that specific reply. If it fails or times out, fixed fallbacks are used.

Each card credits the Pearl Club local who recommends the place (the "Curator spotlight" on its page), and the reply may mention them by first name. About 70% of places have a named curator.

The place data was scraped from Pearl Club's sitemaps and the JSON-LD on each place page (`scraper/`). `load.py` embeds each place once and upserts it, so re-runs are free.

### Requests, not bookings

Pearl Club has no reservation system to talk to, so "book me a table" opens a short form and logs a request to the `concierge_requests` table. Pearl says plainly that nothing is confirmed. Nobody is notified yet; wiring a venue or hotel inbox would be the next step.

Both tables have row level security on with no policies. The app uses the publishable key and can only call two database functions: `match_places` (read only) and `create_concierge_request` (validated insert).

## Run it

Needs Node 22+, Python 3.11+, a Supabase project and an OpenAI API key.

```bash
npm install
cp .env.example .env.local   # fill in the values
```

Run the files in `supabase/migrations/` in order in the Supabase SQL editor, then load the data:

```bash
python3 -m venv scraper/.venv && scraper/.venv/bin/pip install -r scraper/requirements.txt
scraper/.venv/bin/python scraper/scrape.py    # writes data/places.jsonl
scraper/.venv/bin/python scraper/load.py      # embeds and uploads
npm run dev
```

| Variable              | Used by     | Notes                                               |
| --------------------- | ----------- | --------------------------------------------------- |
| `OPENAI_API_KEY`      | app, loader | Chat and embeddings. Set a budget limit on the key. |
| `SUPABASE_URL`        | app, loader |                                                     |
| `SUPABASE_KEY`        | app         | Publishable key.                                    |
| `SUPABASE_SECRET_KEY` | loader only | Never set on Vercel.                                |
| `OPENAI_CHAT_MODEL`   | app         | Planner and chips. Defaults to `gpt-4.1-mini`.      |
| `OPENAI_ANSWER_MODEL` | app         | The reply. Defaults to `gpt-4.1`.                   |

## Checks

```bash
npm run format:check && npm run lint && npm run typecheck && npm run build
npm run eval                                  # against localhost:3000
npm run eval -- https://pearl-concierge.vercel.app
```

`scripts/eval.mjs` sends 25 real conversations and checks the stream: intent, city, that every `[[n]]` points at a real card, that every card URL is a Pearl Club page, reply language, and that booking replies never claim a confirmation. The chat route allows 30 requests per 10 minutes per IP, so restart the dev server between two full runs.

## Known limits

- State lives in the browser. A refresh starts a new chat.
- The planner is a model, so an obscure neighbourhood can still fall through to "which city?".
- Booking is a request log only (see above).
- No map, no geolocation, no accounts.

## Layout

```
scraper/      scrape.py, load.py
supabase/     migrations
scripts/      eval.mjs
src/app/api/  chat (streaming RAG), request (concierge requests)
src/lib/      planner, retrieve, prompt, follow-ups, i18n, request validation
src/components/
```
