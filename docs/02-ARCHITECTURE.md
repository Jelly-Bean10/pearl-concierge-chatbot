# 02 · Architecture

## System diagram

```
 OFFLINE (run once on a laptop)                           ONLINE (Vercel)

 pearlclub.com                                            Browser (React, Chat.tsx)
   sitemap.xml -> sitemap-0/1.xml                            │ POST /api/chat  {messages, city, shownPlaceIds}
   place pages (JSON-LD + tag HTML)                          ▼
        │                                                 /api/chat  (Next.js route handler, Node runtime)
        ▼                                                    │
 scraper/scrape.py ──► data/places.jsonl                     ├─1─ planTurn(): OpenAI chat, JSON schema output
        │                                                    │      -> intent, city, categories, price, search_query
        ▼                                                    ├─2─ retrievePlaces(): OpenAI embedding of search_query
 scraper/load.py                                             │      -> Supabase rpc match_places (filters + cosine)
   OpenAI embeddings (text-embedding-3-small, 1536d)         ├─3─ stream answer: OpenAI chat, stream=true,
        │                                                    │      system prompt + CONTEXT (only retrieved places)
        ▼                                                    └─4─ done: cited refs + 3 follow-up chips
 Supabase Postgres + pgvector  ◄──────── match_places ────────┘
   public.places (1 row per place, 1 embedding per row)      ▲
                                                             │ NDJSON stream: meta, places, delta*, done | error
                                                          Browser renders text + cards for cited places only
```

## Data flow, scrape to answer

1. **Discover**: `scrape.py` reads `https://www.pearlclub.com/sitemap.xml`, follows the `sitemap-N.xml` children, and keeps URLs shaped `/cities/{city}/{category}/{slug}` for the four MVP cities and 23 place categories (about 2,050 URLs).
2. **Extract**: for each page, parse the JSON-LD node whose `@id` ends in `#place` (name, descriptions, images, geo, price, links) and the tag sections in the HTML (venue type, cuisine, audience, "Appears in" lists). Pages with no `#place` node are stubs and are skipped (about 13%).
3. **Store raw**: write one JSON object per place to `data/places.jsonl`. HTML is cached on disk so re-runs are free.
4. **Embed and load**: `load.py` builds one text chunk per place, embeds changed rows in batches of 100, and upserts into `public.places` keyed by URL.
5. **Answer a message** (`/api/chat`):
   - **Plan** (one small structured-output call, ~0.5 to 1 s): classify intent, resolve the city (latest message, then conversation, then UI chip), pick category and price filters, and rewrite the message into a standalone search phrase ("something cheaper" becomes "affordable casual dinner restaurant").
   - **Retrieve**: embed the search phrase, call `match_places` (city filter always, category and price filters when present, relaxed once if fewer than 3 results), keep rows with cosine similarity of at least `MIN_SIMILARITY`.
   - **Answer**: stream a reply from the model with the system prompt plus a CONTEXT message listing only the retrieved places, numbered `[[1]]..[[8]]`.
   - **Render**: the browser shows the streamed text, turns `[[n]]` markers into small numbered buttons, and shows cards only for cited places, built from database fields.

## Technology choices

| Choice | One-line rationale |
|---|---|
| Next.js 16.4 App Router + TypeScript | Founder's stack; one repo for UI and API route; deploys to Vercel with zero config. |
| Tailwind CSS v4 (as scaffolded) | Founder's stack; tokens live in one CSS `@theme` block, no config file. |
| No component library | Seven small components; Radix/shadcn would add more code than it saves here. |
| Plain `<img>` for photos | Pearl Club images are on DatoCMS's imgix CDN, which resizes via URL params; `next/image` would add remote-pattern config for no gain. |
| Python 3.12+ scraper (httpx + BeautifulSoup) | Founder's stated preference for Python scraping; run once locally, not deployed. |
| JSON-LD extraction instead of DOM parsing | Place pages carry complete schema.org JSON-LD; it is stable and far simpler than CSS selectors. DOM is used only for tags, which JSON-LD lacks. |
| Supabase Postgres + pgvector | Founder's stack; filters (city, category, price) and vector search in one SQL query. |
| No vector index | ~1,800 rows is an exact scan in milliseconds; approximate indexes plus WHERE filters can silently drop matches. |
| RLS on, no policies, secret key on the server only | Nothing is exposed to the browser; the anon key is never used. |
| OpenAI `text-embedding-3-small` (1536 dims) | Cheap (the whole corpus costs about $0.02 to embed), good quality, not deprecated. |
| OpenAI `gpt-4.1-mini` via Chat Completions | Fast first token, supports strict JSON-schema output and streaming, not deprecated. Overridable with `OPENAI_CHAT_MODEL`. |
| Official `openai` npm SDK, no AI SDK or LangChain | Three explicit calls are easier to read and debug than a framework; avoids version-churn APIs. |
| Separate planner call before retrieval | Makes follow-ups work ("cheaper", "the second one"), detects the city, and extracts filters, in one structured call. Without it, vector search on "something cheaper" returns noise. |
| Citation markers `[[n]]` | Lets the UI tie every mentioned place to a database row and drop anything else. |
| Hand-rolled NDJSON stream | One event per line (`meta`, `places`, `delta`, `done`, `error`); about 15 lines on each side, fully specified in 04-API-SPEC. |
| Deterministic follow-up chips | Zero latency and zero cost; good enough for three suggestions. |
| In-memory per-IP rate limit + OpenAI budget cap | Enough for a demo link; no Redis needed. |
| Vercel (Node runtime, `maxDuration = 60`) | Founder's stack; streaming route handlers work out of the box. |

## Latency budget (target, per message)

| Step | Typical |
|---|---|
| Planner call | 500 to 1,000 ms |
| Embedding | 150 to 300 ms |
| `match_places` RPC | 50 to 150 ms |
| First answer token | 400 to 800 ms |
| **Time to first word** | **about 1.5 to 2.5 s** (must stay under 4 s) |

The UI shows "Searching Pearl Club's guides…" until the first token arrives.

## Timeouts and failure behaviour

| Call | Timeout | On failure |
|---|---|---|
| Planner | 8 s | Fall back to a plain search in the selected city (or ask for a city). Logged, not shown to the user. |
| Embedding | 8 s | `error` event `upstream_timeout` |
| Answer stream | 25 s total | `error` event `upstream_timeout` |
| OpenAI 429 | n/a | `error` event `upstream_rate_limited` |
| Supabase error | 20 s client default | `error` event `internal` |
| Whole route | 60 s (`maxDuration`) | Vercel ends the function |

Every error the user sees has a "Try again" button that resends the same message.
