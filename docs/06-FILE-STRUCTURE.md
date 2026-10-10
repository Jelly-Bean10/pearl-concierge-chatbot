# 06 · File Structure

The complete tree after the MVP is built. Do not add files outside this list. (Updated to include the multilingual and concierge additions, see 11-CONCIERGE-AND-I18N.) Files marked *(scaffold)* come from `create-next-app` and are not edited unless noted.

```
.
├── README.md                          What this is, run locally, deploy (written already; keep)
├── AGENTS.md                          (scaffold) Next.js agent notes; leave as generated
├── .env.example                       Env var names with comments, no values (commit this)
├── .env.local                         Real secrets for local dev (never commit; covered by .gitignore)
├── .gitignore                         (scaffold) + lines added in task T02
├── .prettierrc.json                   {"printWidth": 120}
├── .prettierignore                    Paths Prettier must skip
├── eslint.config.mjs                  (scaffold)
├── next.config.ts                     (scaffold) leave as generated
├── next-env.d.ts                      (scaffold)
├── package.json                       (scaffold) + deps and scripts added in T01/T02
├── package-lock.json                  (generated)
├── tsconfig.json                      (scaffold)
├── public/                            (scaffold) default SVGs; delete them in T03, keep the folder
├── data/
│   └── places.jsonl                   Scraper output, one place per line (gitignored, regenerate with scrape.py)
├── docs/
│   ├── 00-OVERVIEW.md ... 10-DEPLOYMENT.md
│   └── assets/                        Reference screenshots of the finished UI
├── scraper/
│   ├── requirements.txt               Pinned Python deps
│   ├── scrape.py                      Sitemap discovery + JSON-LD/tag extraction -> data/places.jsonl
│   ├── load.py                        Embeds places and upserts them into Supabase
│   ├── .venv/                         Python virtualenv (gitignored)
│   └── .cache/html/                   Raw HTML cache (gitignored)
├── scripts/
│   └── eval.mjs                       Grounding and behaviour check against a running app
├── supabase/
│   └── migrations/
│       ├── 20261010000000_places.sql  Table, RLS, match_places() function
│       └── 20261010000100_concierge_requests.sql  Requests table, RLS, create_concierge_request()
└── src/
    ├── app/
    │   ├── favicon.ico                (scaffold)
    │   ├── globals.css                Tailwind import + design tokens + 2 utilities + keyframes
    │   ├── layout.tsx                 Fonts, metadata, viewport, <html>/<body>
    │   ├── page.tsx                   Renders <Chat />
    │   └── api/
    │       ├── chat/
    │       │   └── route.ts           POST /api/chat: validate, plan, retrieve, stream answer
    │       └── request/
    │           └── route.ts           POST /api/request: validate and log a concierge request
    ├── components/
    │   ├── Chat.tsx                   Client root: state, fetch + stream handling, layout shell
    │   ├── Header.tsx                 Wordmark, gradient bar, city chips, New chat
    │   ├── Welcome.tsx                Greeting + four starter cards (localized)
    │   ├── RequestForm.tsx            Inline concierge request form (venue and hotel service)
    │   ├── AssistantMessage.tsx       Pearl's text with citation buttons, card row, error, follow-ups
    │   ├── PlaceCard.tsx              One place card
    │   └── Composer.tsx               Textarea + send button + footer note
    └── lib/
        ├── types.ts                   Shared request/response/event types (client + server)
        ├── catalog.ts                 Supported cities and place categories (client + server)
        ├── i18n.ts                    Six-language UI dictionary, language list, service types (client + server)
        ├── use-lang.ts                Language selection hook: saved choice, browser language, English (client)
        ├── request-validate.ts        Request form rules shared by form and /api/request (client + server)
        ├── match-place.ts             Match a venue the user named to a retrieved candidate (server)
        ├── citations.ts               [[n]] marker parsing (client + server)
        ├── validate.ts                Request body validation, message length limit (client + server)
        ├── read-stream.ts             NDJSON reader for fetch responses (client)
        ├── clients.ts                 Lazy OpenAI + Supabase clients, model names (server only)
        ├── planner.ts                 Planner call with JSON schema (server only)
        ├── retrieve.ts                Embedding + match_places + card mapping (server only)
        ├── prompt.ts                  SYSTEM_PROMPT + buildContext (server only)
        ├── suggestions.ts             Deterministic follow-up chips (server)
        └── rate-limit.ts              In-memory per-IP limiter (server only)
```

## Rules

- Server-only modules start with `import "server-only";`. Never import them from `src/components/*`.
- Client components that use hooks start with `"use client";` (`Chat.tsx`, `Composer.tsx`). The others are imported by `Chat.tsx` and therefore also run on the client; they need no directive.
- Path alias `@/` maps to `src/` (scaffold default).
- No `utils.ts`, `constants.ts`, `hooks/`, `services/`, or `index.ts` barrel files. Put code in the file named above.
- Python code lives only in `scraper/`. It is never imported by the app.
