# 09 · Git Workflow

## Branches

| Branch | Purpose |
|---|---|
| `main` | Production. Vercel deploys it to the public URL. Only receives merges. |
| `feat/pearl-concierge-mvp` | All MVP work (T01 to T12). Vercel builds preview deployments from it. |
| `fix/<short-kebab-description>` | Any fix after the MVP is merged, for example `fix/card-snap-alignment`. |

Create the feature branch right after the initial commit in T01. Merge it into `main` in T13 with a merge commit (`git merge --no-ff`), or through a GitHub pull request if the repo is on GitHub (preferred, so there is a visible record).

## Commit format

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary, max 72 chars>

<optional body: what and why, wrapped at 72>
```

- Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`.
- Scopes: `app`, `ui`, `api`, `rag`, `scraper`, `db`, `qa`, `deploy`, `docs`.
- Imperative mood ("add", not "added"). No trailing period. Never commit `.env.local`, `data/`, or `scraper/.cache/`.

## Commit checkpoints

One commit per task, in this order. Run `npm run format && npm run lint && npm run typecheck` before each commit from T02 onward.

| Task | Commit message |
|---|---|
| T01 (before scaffolding) | `docs: add implementation docs` |
| T01 | `chore(app): scaffold Next.js 16 app with Tailwind and TypeScript` |
| T02 | `chore(app): add prettier, scripts, env template and ignores` |
| T03 | `feat(ui): add Pearl Club design tokens and chat shell` |
| T04 | `feat(db): add places table and match_places function` |
| T05 | `feat(scraper): scrape Pearl Club place pages from sitemap and JSON-LD` |
| T06 | `feat(scraper): embed places and upsert into Supabase idempotently` |
| T07 | `feat(rag): add planner, retrieval, prompt and follow-up suggestions` |
| T08 | `feat(api): stream grounded answers as NDJSON from /api/chat` |
| T09 | `feat(ui): render streamed answers with citations and place cards` (only if T09 needed code changes; otherwise skip) |
| T10 | no commit (data only) |
| T11 | `chore(rag): calibrate similarity threshold` with body `R=<value> I=<value> MIN_SIMILARITY=<value>` |
| T12 | `test(qa): add grounding eval script`, then `fix(<scope>): <what QA found>` (one commit per distinct fix) |
| T13 | merge commit `chore(deploy): release MVP to production` |
| T14 | `docs: add live demo link to README` |

## Rules

- Never force-push `main`.
- Never rewrite history after pushing.
- Never commit secrets. Before every push, run `git diff --cached | grep -iE "sk-|sb_secret|service_role|eyJhbGci"` and expect no output.
- Keep commits small enough that each one builds.
