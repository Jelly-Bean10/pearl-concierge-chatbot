# 07 · Implementation Plan

Ordered, atomic tasks. Do them in order. Each ends runnable, and each ends with a commit (09-GIT-WORKFLOW lists the exact messages). Total hands-on time is about 3.5 hours, plus about 25 unattended minutes for the full scrape (it runs in the background during T07 to T10).

Prerequisites: Node 22+ (`node --version`), npm, Python 3.11+, git, a Supabase account, an OpenAI API key with billing, a Vercel account linked to GitHub.

Global rules for every task:

- Copy code from the referenced doc verbatim. If something does not compile, fix the smallest thing and note it in the commit body; do not redesign.
- After every task: `npm run format`, `npm run lint`, `npm run typecheck` must pass (from T02 onward).
- Never write real secrets into any committed file. Real values go only in `.env.local` and in Vercel's env settings.

---

### T01 · Repo and scaffold (15 min)

The repo root already contains `docs/` and `README.md`. `create-next-app` refuses to run when any `README*` file exists in the directory, so move it outside the repo first.

```bash
git init -b main
```

```bash
git add docs README.md && git commit -m "docs: add implementation docs"
```

```bash
git checkout -b feat/pearl-concierge-mvp
```

```bash
mv README.md ../README.keep.md
```

```bash
npx create-next-app@16.4.0 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-react-compiler --no-agent-feedback --disable-git --yes
```

```bash
mv ../README.keep.md README.md
```

```bash
npm install openai@7.32.0 @supabase/supabase-js@2.117.3 server-only@0.0.1
```

```bash
npm install -D prettier@3.9.9
```

`git status` must not show `README.md` as modified (the scaffold's README was overwritten by the original). Commit with the T01 message from 09-GIT-WORKFLOW.

**Acceptance:** `npm run dev` serves the default Next.js page at http://localhost:3000. `package.json` lists `next 16.4.0`, `react 19.3.0`, `openai 7.32.0`, `@supabase/supabase-js 2.117.3`.

---

### T02 · Tooling and env template (10 min)

Files: `package.json`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `.env.example`.

1. Add to `package.json` `"scripts"` (keep the scaffold's `dev`, `build`, `start`, `lint`):
   ```json
   "typecheck": "tsc --noEmit",
   "format": "prettier --write .",
   "format:check": "prettier --check .",
   "eval": "node scripts/eval.mjs"
   ```
   and a top-level `"engines": { "node": ">=22" }`.
2. `.prettierrc.json`:
   ```json
   { "printWidth": 120 }
   ```
3. `.prettierignore`:
   ```
   .next
   node_modules
   package-lock.json
   AGENTS.md
   docs
   data
   scraper
   supabase
   ```
4. Append to `.gitignore` (the scaffold's `.env*` line would otherwise hide `.env.example`):
   ```
   !.env.example
   data/
   scraper/.venv/
   scraper/.cache/
   __pycache__/
   ```
5. `.env.example`: copy from 10-DEPLOYMENT section 1.

**Acceptance:** `npm run format:check`, `npm run lint`, `npm run typecheck` pass. `git status` shows `.env.example` as a new file.

---

### T03 · Design tokens and static UI shell (30 min)

Files: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/lib/types.ts`, `src/lib/catalog.ts`, `src/lib/citations.ts`, `src/lib/validate.ts`, `src/lib/read-stream.ts`, all six files in `src/components/`. Delete the scaffold's SVGs in `public/`.

Copy every file verbatim from 05-DESIGN-SYSTEM (UI) and 04-API-SPEC (the five `src/lib` files listed). The UI will call `/api/chat`, which does not exist yet; that is expected.

**Acceptance:**
- At 390 px wide (browser devtools), the welcome screen matches `docs/assets/mobile-welcome.png`: wordmark, gradient bar, city chips, headline, four starter cards, composer.
- Tapping a city chip toggles it; the headline changes to "Where are you headed in London?".
- Sending a message shows the user bubble, then the red error block (404 from the missing route) with "Try again".
- No horizontal page scroll at 320 px.

---

### T04 · Supabase project and schema (10 min)

Follow 10-DEPLOYMENT section 2. Create `supabase/migrations/20261010000000_places.sql` with the exact SQL from 03-DATA-PIPELINE section 6 and run it in the SQL editor. Fill `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`. Also fill `OPENAI_API_KEY`.

**Acceptance:** In the SQL editor, `select count(*) from public.places;` returns `0`, and `select proname from pg_proc where proname = 'match_places';` returns one row.

---

### T05 · Scraper (20 min + 25 min unattended)

Files: `scraper/requirements.txt`, `scraper/scrape.py` (verbatim from 03-DATA-PIPELINE section 10).

Run the commands in 03-DATA-PIPELINE section 11 up to and including `scrape.py --limit 40`.

**Acceptance (limit run):** log ends with `"count"` between 30 and 40; `data/places.jsonl` has that many lines; every line has non-empty `name`, `url` starting with `https://www.pearlclub.com/cities/`, `description`, and at least one `image_urls` entry; London rows have `"country_flag": "🇬🇧"`; no URL contains `/arts-and-culture/`.

Then start the full crawl in a separate terminal and continue with T06 while it runs:

```bash
scraper/.venv/bin/python scraper/scrape.py
```

**Acceptance (full run, check during T10):** final log line has `count` within ±5% of 1,785 and `skipped` within ±5% of 266 (values measured on 2026-10-10; Pearl Club adds places over time).

---

### T06 · Loader with a small batch (15 min)

File: `scraper/load.py` (verbatim from 03-DATA-PIPELINE section 10).

`load.py` reads whatever is in `data/places.jsonl`. While the full crawl is still running, the file still holds the 40-row limit run, which is what you want here.

1. `scraper/.venv/bin/python scraper/load.py --dry-run` prints one embedding text.
2. `scraper/.venv/bin/python scraper/load.py` loads the rows.
3. Run it again: it must log `0 new or changed`.

**Acceptance:** `select count(*) from public.places;` equals the limit-run count. Second run made no OpenAI calls.

---

### T07 · Server library (20 min)

Files: `src/lib/clients.ts`, `src/lib/rate-limit.ts`, `src/lib/planner.ts`, `src/lib/retrieve.ts`, `src/lib/prompt.ts`, `src/lib/suggestions.ts` (verbatim from 04-API-SPEC).

**Acceptance:** `npm run typecheck` and `npm run lint` pass. `npm run build` passes without `.env.local` present (rename it temporarily to check, then rename it back).

---

### T08 · Streaming route (15 min)

File: `src/app/api/chat/route.ts` (verbatim from 04-API-SPEC section 13).

**Acceptance:**
- The curl in 04-API-SPEC section 15 (use `"city":"london"` and a query that fits the 40 loaded rows, for example `"art gallery"`) streams `meta`, `places`, `delta`s, `done`.
- `curl -s -X POST localhost:3000/api/chat -H 'Content-Type: application/json' -d '{}'` returns 400 with an `error.code` of `bad_request`.
- The dev server log shows one `retrieval` and one `turn_done` JSON line per request.

---

### T09 · Wire up and smoke-test the UI (15 min)

No new files: the UI from T03 now talks to the real route.

**Acceptance (London, with the 40 rows loaded):**
- "Find hidden gems" streams text with numbered citation buttons and shows cards; tapping a citation scrolls to its card; "View on Pearl Club" opens the right live page.
- The London chip becomes selected automatically after the first answer if it was not.
- Follow-up chips appear under the last answer only.
- "New chat" resets to the welcome screen.

---

### T10 · Full data load (10 min, after the full crawl finishes)

```bash
scraper/.venv/bin/python scraper/load.py
```

**Acceptance:** the queries in 03-DATA-PIPELINE section 12 show four cities, the total equals the scraper's `count`, and the Burgh House lookup returns its row.

---

### T11 · Similarity calibration (15 min)

Follow 03-DATA-PIPELINE section 9 exactly. Change only the `MIN_SIMILARITY` constant if the rule says so.

**Acceptance:** the chosen value and the measured `R` and `I` are in the commit message.

---

### T12 · QA pass (30 min)

Create `scripts/eval.mjs` verbatim from 08-TESTING-QA section 1 and commit it (`test(qa): add grounding eval script`). Then follow 08-TESTING-QA in full against `npm run dev`: `npm run eval`, the manual script, the hallucination review, the edge cases, and the mobile check. Fix only what fails. If a fix touches the system prompt, re-run the whole eval.

**Acceptance:** eval 10/10, manual script all pass, zero hallucinations in the review, all edge cases behave as specified.

---

### T13 · Deploy (15 min)

Follow 10-DEPLOYMENT sections 3 to 6. Merge the feature branch into `main` so the production deployment is built from `main`.

**Acceptance:** `npm run eval -- https://<project>.vercel.app` passes 10/10, and the production URL opens on a phone in a private window without any login prompt.

---

### T14 · Handoff (10 min)

1. Run the mobile check (08-TESTING-QA section 6) on the production URL on a real phone.
2. Update the "Live demo" line at the top of `README.md` with the production URL.
3. Send the founder the link plus the three-sentence summary in 10-DEPLOYMENT section 7.

**Acceptance:** the founder can open the link and get a grounded answer on his phone.
