# 00 · Overview

## What is being built

**Ask Pearl**: a mobile-first chat assistant for Pearl Club (pearlclub.com). A traveler picks a city, asks for something ("a cozy cafe to read in", "hidden gems", "book an experience"), and Pearl answers in a few warm sentences with **cards for real Pearl Club places**. Every card links to that place's page on pearlclub.com.

The founder brief asked for:

| Brief item | How this MVP covers it |
|---|---|
| Conversational, human-like interface | Streaming chat answers from an LLM, written as a well-travelled local friend |
| Pearl Club content | 1,785 places scraped from pearlclub.com (founder-authorized), stored with embeddings |
| Personalization (preferences, history, location) | City picker + city detected from the conversation; budget, mood, and cuisine extracted from the whole conversation on every turn; "show me different options" excludes places already shown |
| Greeting and menu ("Find Hidden Gems", "Book an Experience") | Welcome screen with four starter cards |
| Recommendations | Retrieval-augmented answers with place cards |
| Follow-up interaction | Three follow-up chips after every answer |
| Testing link | Public Vercel production URL |

## The one rule that matters most

**The bot never invents a place.** Curation is Pearl Club's whole product, so a hallucinated venue is disqualifying. This is enforced in four layers, all specified in these docs:

1. The model only ever sees candidate places retrieved from the database for this turn (04-API-SPEC, `buildContext`).
2. The system prompt forbids mentioning any place not in that list and requires a citation marker `[[n]]` after every place name (04-API-SPEC, `SYSTEM_PROMPT`).
3. Cards are rendered only from database rows, never from model text. A marker that points outside the candidate list is dropped (`citations.ts`).
4. QA runs an automated grounding check plus a manual hallucination review before the link is shared (08-TESTING-QA).

When nothing fits, Pearl says so in one sentence and suggests a different request. It never fills the gap.

## Success criteria (the reviewer's checklist)

The build is done when all of these are true on the deployed URL:

1. Opening the link on a phone shows the welcome screen within 2 seconds, with no horizontal page scroll.
2. "Find hidden gems" with London selected streams an answer and shows 2 to 4 place cards with photo, category, city, price, summary, and a working "View on Pearl Club" link.
3. Time to first streamed word is under 4 seconds for a normal request.
4. A follow-up ("something cheaper") stays in the same city without re-selecting it.
5. Asking about an unsupported city (e.g. "bars in Lagos") gets a polite "not covered yet" and no cards.
6. `npm run eval` against the deployed URL passes 10/10.
7. The manual hallucination review in 08-TESTING-QA finds zero invented places across 15 answers.
8. `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` all pass.

## Explicit non-goals

Do not build any of these, even partially. Simplicity is part of what is being evaluated.

- Booking, reservations, payments, availability checks. "Book an experience" recommends experiences and links to the venue's own website.
- User accounts, auth, saved trips, server-side chat persistence. State lives in React memory and is lost on refresh.
- Multilingual UI. (The model replies in the user's language as a free side effect of one prompt line; nothing else is translated and it is not tested.)
- Maps, geolocation, "near me". The city picker is the location input; travelers usually plan before they arrive.
- Products (fashion, home goods, etc.), curator profiles, blog content.
- Cities beyond New York City, London, Paris, Los Angeles. Adding one later is a two-line change plus a re-scrape.
- Dark mode. Pearl Club is light only.
- An admin panel, analytics, or a CMS integration.
- Automated unit-test suites. The QA layer is the eval script plus the manual script in 08.
- Any agent framework (LangChain, AI SDK, etc.). The pipeline is three plain API calls.

## How a reviewer will judge it

The founder (HN culture, values simplicity, watches whether AI is used "as a tool rather than a crutch") will likely:

- Open the link on his phone and try the starter cards.
- Try to break it: ask about a place he knows is not on Pearl Club, a city he does not cover, something off-topic, a prompt injection.
- Click cards through to pearlclub.com.
- Skim the repo: is it small, readable, free of needless abstraction? Are the AI calls deliberate and few?

What makes it read as "tool, not crutch": a hand-written data pipeline from the site's JSON-LD, a tiny explicit RAG loop (plan, retrieve, answer) with no framework, deterministic follow-ups instead of extra model calls, and a grounding check you can run.

## Document map

| Doc | Read it when |
|---|---|
| 01-RESEARCH-FINDINGS | You need facts about pearlclub.com's structure |
| 02-ARCHITECTURE | You need the big picture and why each technology was chosen |
| 03-DATA-PIPELINE | Building the scraper, loader, and database |
| 04-API-SPEC | Building `/api/chat` and the server library |
| 05-DESIGN-SYSTEM | Building any UI |
| 06-FILE-STRUCTURE | Unsure where a file goes |
| 07-IMPLEMENTATION-PLAN | Start here for the ordered task list |
| 08-TESTING-QA | Before calling anything done |
| 09-GIT-WORKFLOW | Committing |
| 10-DEPLOYMENT | Setting up Supabase and Vercel, shipping the link |
