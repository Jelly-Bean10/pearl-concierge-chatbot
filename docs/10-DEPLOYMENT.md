# 10 · Deployment

## 1. Environment variables

`.env.example` (commit this file exactly):

```bash
# Server-side only. Never prefix any of these with NEXT_PUBLIC_.

# OpenAI API key (platform.openai.com > API keys). Used for embeddings and chat.
OPENAI_API_KEY=

# Supabase project URL (Project Settings > API), e.g. https://abcdefghijkl.supabase.co
SUPABASE_URL=

# Supabase secret key (Project Settings > API Keys > Secret keys, starts with sb_secret_).
# The legacy service_role key also works. Bypasses RLS: server and loader only.
SUPABASE_SECRET_KEY=

# Optional. Chat model for the planner and answers. Defaults to gpt-4.1-mini.
OPENAI_CHAT_MODEL=
```

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | app, `load.py` | Use a dedicated OpenAI project with a budget limit (section 4). |
| `SUPABASE_URL` | yes | app, `load.py` | |
| `SUPABASE_SECRET_KEY` | yes | app, `load.py` | Never expose to the browser. |
| `OPENAI_CHAT_MODEL` | no | app | Leave empty. Only if `gpt-4.1-mini` is ever retired: set `gpt-5-mini`, delete the two `temperature` lines (`planner.ts`, `route.ts`; GPT-5 models reject them), and add `reasoning_effort: "minimal"` to both `create` calls so reasoning does not eat the token budget. |

Locally, copy `.env.example` to `.env.local` and fill it. `load.py` reads the same `.env.local`.

## 2. Supabase setup

1. supabase.com > New project. Name `pearl-concierge`. Region **East US (North Virginia)** (`us-east-1`), to sit next to Vercel's default function region `iad1`. Free plan is enough. Save the database password somewhere private (not needed by the app).
2. SQL editor > New query > paste the full contents of `supabase/migrations/20261010000000_places.sql` > Run. Expect "Success. No rows returned."
3. Project Settings > API: copy the Project URL into `SUPABASE_URL`.
4. Project Settings > API Keys: create or copy a **secret** key into `SUPABASE_SECRET_KEY`. Do not use the publishable/anon key; it can read nothing because of RLS.
5. Verify: `select count(*) from public.places;` returns 0.

Note: free Supabase projects pause after about a week of inactivity. Before sending the link, open the project dashboard once to make sure it is active; if it was paused, click "Restore".

## 3. Seeding the database

From the repo root, after `.env.local` is filled (commands from 03-DATA-PIPELINE section 11):

```bash
scraper/.venv/bin/python scraper/scrape.py
```

```bash
scraper/.venv/bin/python scraper/load.py
```

Then run the verification queries in 03-DATA-PIPELINE section 12. Seeding is done from a laptop, never from Vercel. Production and local development share the same Supabase project.

## 4. OpenAI cost guard

In platform.openai.com: create a project `pearl-concierge`, create the API key inside it, and set a monthly budget of **$10** under the project's limits. A full conversation turn costs well under one cent (two small chat calls and one embedding), so $10 covers thousands of messages and caps abuse of the public link.

## 5. Vercel

1. Push the repo to GitHub (private is fine).
2. vercel.com > Add New > Project > import the repo. Framework preset: Next.js (auto-detected). Root directory: `./`. Build command, output, and install command: leave as defaults.
3. Environment Variables: add `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` for **Production** and **Preview**. Leave `OPENAI_CHAT_MODEL` unset.
4. Deploy. Function region stays the default (`iad1`, Washington D.C.), next to the Supabase region chosen above. No `vercel.json` is needed; `maxDuration = 60` is set in the route file.
5. Production branch: `main` (Settings > Git). Merging the feature branch into `main` triggers the production deploy.
6. **Share the production domain, not a deployment URL.** Vercel's default Deployment Protection requires a Vercel login for preview and per-deployment URLs (`<project>-<hash>-<team>.vercel.app`). The production domain `https://<project>.vercel.app` is public. Verify it in a private browser window: it must load without any login prompt. If it asks to log in, go to Settings > Deployment Protection and make sure protection applies to previews only, not production.

## 6. Verifying the deployed link

Run all of these against `https://<project>.vercel.app`:

1. Open it in a private window on desktop and on a phone. The welcome screen loads with the Pearl Club fonts.
2. `npm run eval -- https://<project>.vercel.app` passes 10/10.
3. Manual test script steps 2, 3, 8, 10 from 08-TESTING-QA.
4. Vercel > Project > Logs: each message shows `retrieval` and `turn_done` lines and no `turn_failed`.
5. The mobile check in 08-TESTING-QA section 6.

## 7. Handoff message

Send the founder the production URL with this summary (adjust numbers to the real ones):

> Here's the testing link: https://<project>.vercel.app. Pearl answers only from 1,785 Pearl Club places scraped from your site (NYC, London, Paris, LA). Every suggestion links back to its Pearl Club page, and it says so plainly when nothing fits instead of inventing a place. It's a small web app with a three-step loop (understand the request, search your places, write a grounded reply) and no agent framework, so it's easy to read and extend.
