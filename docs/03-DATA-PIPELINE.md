# 03 · Data Pipeline

Scrape pearlclub.com once on a laptop, embed, and load into Supabase. Nothing in this pipeline runs on Vercel. All facts here were verified against the live site on 2026-10-10 (see 01-RESEARCH-FINDINGS).

```
sitemap.xml ─► sitemap-0.xml, sitemap-1.xml ─► 2,051 place URLs (4 cities, 23 categories)
   ─► GET each canonical URL (4 workers, 0.5 s pause each, HTML cached) ─► parse JSON-LD #place + tag HTML
   ─► data/places.jsonl (1,785 places on 2026-10-10; 266 URLs (13%) were stubs and skipped)
   ─► load.py: build embedding text ─► text-embedding-3-small (1536d) ─► upsert public.places on url
```

## 1. Scope

| Setting | Value |
|---|---|
| Cities | `new-york-city`, `london`, `paris`, `los-angeles` |
| Categories | The 23 slugs in `CATEGORY_LABELS` in `scrape.py` (places only; products and curator profiles are excluded) |
| Expected output | 1,785 places as of 2026-10-10 (NYC 635, London 601, Paris 282, LA 267); the exact count is logged |

To add a city later: add its slug to `CITIES` in `scraper/scrape.py` and to `CITIES` in `src/lib/catalog.ts` (with name and flag), add it to the `CitySlug` type, re-run both scripts.

## 2. Discovery

- Start at `https://www.pearlclub.com/sitemap.xml` (a sitemap index). Its children `sitemap-0.xml` and `sitemap-1.xml` contain every place URL. The other children (`places-sitemap.xml`, `recommendations-sitemap.xml`, ...) list collection pages and are ignored.
- Keep a `<loc>` only if it matches `^https://www\.pearlclub\.com/cities/([a-z0-9-]+)/([a-z0-9-]+)/([a-z0-9-]+)$` with group 1 in the city list and group 2 in the category list.
- City listing pages (`/cities/london`, `/cities/london/dinner`) are client-rendered and only contain ~4 place links in their HTML. Do not crawl them; the sitemap is the source of truth.
- Three category path segments 308-redirect. Request the canonical URL directly and store it:

| Sitemap segment | Canonical segment |
|---|---|
| `arts-and-culture` | `arts-culture` |
| `health-and-wellness` | `health-wellness` |
| `parks-and-nature` | `parks-nature` |

`category_slug` in the database keeps the sitemap form (`arts-and-culture`); only `url` uses the canonical form.

## 3. Extraction

### JSON-LD (primary source)

Each place page has one `<script type="application/ld+json">` containing `{"@context": ..., "@graph": [...]}`. The graph holds `WebPage`, the place node, `ItemList`, and `BreadcrumbList`. **Select the node whose `@id` ends with `#place`.** Its `@type` varies (`Restaurant`, `BarOrPub`, `TouristAttraction`, `CafeOrCoffeeShop`, `LocalBusiness`, `Bakery`, `LodgingBusiness`, `ShoppingCenter`, `City`, `HealthClub`, `EventVenue`, `Place`, `NightClub`, ...) so never select by type.

| Output field | JSON-LD path (on the `#place` node) | Notes |
|---|---|---|
| `name` | `name` | trimmed |
| `summary` | `disambiguatingDescription` | 1 to 2 sentence curated summary; present on newer pages only, else null |
| `description` | `description` | median 1,376 chars, max about 2,200; paragraphs separated by `\n\n`. If it starts with `lorem ipsum` (CMS placeholder, 5 pages), use the summary as the description and set `summary` to null |
| `image_urls` | `image` (array of DatoCMS URLs; may be a string) | first 5 kept |
| `website_url` | first `sameAs` entry whose host is not a social network | can be a booking widget; null if none |
| `instagram_url` | first `sameAs` entry on instagram.com | |
| `map_url` | `hasMap` | Google Maps link |
| `lat`, `lng` | `geo.latitude`, `geo.longitude` | |
| `price_range` | `priceRange` | one of `$`..`$$$$`, else null |
| `price_level` | `len(priceRange)` | 1 to 4, else null |
| `city_name` | `address.addressLocality` | |
| `country_code` | `address.addressCountry` | London uses `"UK"`; map to ISO `"GB"` |
| `schema_type` | `@type` | informational |

Pages **without** a `#place` node are skipped. Two kinds exist: stub pages (title and meta description only, about 12% of place URLs) and product pages under product categories (their node is an `Article`). Both are excluded by this rule.

### Tag sections (HTML, secondary source)

JSON-LD has no tags. The page renders them as labelled groups:

```html
<p class="mb-2 font-mono text-sm uppercase text-gray-400">Venue Type</p>
<div class="flex flex-wrap gap-2">
  <a class="no-underline" href="/places-cafe"><div ...>#cafe</div></a>
</div>
```

Rule: for every `<p>` with class `font-mono`, take its next sibling `<div>` and read its `<a href>` values.

- Label `Appears in`: links to `/recommendations/...`; keep the link **text** (for example `Best Cheap Bars in Berlin`) in `lists`.
- Any other label (`Venue Type`, `Venue Focus`, `Venue Features`, `Cuisine Type`, `Cuisine Focus`, `Place Attribute`, `Target Audience`): links to `/places-{tag}`; keep `{tag}` (for example `datenight`, `neighbourhoodgem`, `vegetarianfriendly`) in `tags`.

In the 2026-10-10 run, 61% of places have tags and 99% have at least one `lists` entry.

## 4. Record schema (`data/places.jsonl`)

One JSON object per line, sorted by `url`. Real record from the 2026-10-10 run (description and image list shortened here):

```json
{
  "url": "https://www.pearlclub.com/cities/london/arts-culture/burgh-house",
  "slug": "burgh-house",
  "city_slug": "london",
  "city_name": "London",
  "country_code": "GB",
  "country_flag": "🇬🇧",
  "category_slug": "arts-and-culture",
  "category_label": "Arts & Culture",
  "schema_type": "TouristAttraction",
  "name": "Burgh House",
  "summary": "Queen Anne mansion serving as a neighborhood arts hub, gallery, and local history museum. Classical recitals fill the wood-paneled music room, while the secluded terrace garden serves daytime coffee.",
  "description": "The wrought-iron gate at the entrance to Burgh House still bears the initials of Dr. William Gibbons, an early resident and physician who expanded the property ...",
  "price_range": "$",
  "price_level": 1,
  "image_urls": [
    "https://www.datocms-assets.com/55798/1787804434-burgh-house-1.jpeg",
    "https://www.datocms-assets.com/55798/1787804434-burgh-house-2.jpeg",
    "..."
  ],
  "website_url": "https://www.burghhouse.org.uk",
  "instagram_url": "https://www.instagram.com/burghhouse1704",
  "map_url": "https://www.google.com/maps/place/data=!3m1!4b1!4m2!3m1!1s0x48761a62bfe0b0ed:0x93175d717ff38690",
  "lat": 51.5582,
  "lng": -0.175056,
  "tags": [
    "architecture",
    "artgallery",
    "garden",
    "historic",
    "historicsite",
    "history",
    "museum",
    "specialoccasions"
  ],
  "lists": [
    "Best Art Galleries in London",
    "Best Cheap Arts & Culture in London",
    "Best Historic Places in London",
    "Best Historic Sites in London",
    "Best Museums in London",
    "Best Places for Architecture Lovers in London",
    "Best Places for History Buffs in London",
    "Best Places for Special Occasions in London",
    "Best Places with a Garden in London"
  ]
}
```

## 5. Embedding

| Setting | Value |
|---|---|
| Model | `text-embedding-3-small` |
| Dimensions | 1536 (model default; do not pass `dimensions`) |
| Chunks per place | exactly 1 (descriptions are at most about 2,200 characters, well under the model limit; chunking would only fragment one place into several rows) |
| Batch size | 100 inputs per API call |
| Cost | about 0.7 M tokens for the whole corpus, under $0.02 |

Embedding text template (built by `embedding_text()` in `load.py`):

```
{name}
{category_label} in {city_name}. Price: {price_range or "unknown"}.
Tags: #tag1 #tag2 ...                        (line omitted if no tags)
Featured in: List one; List two              (line omitted if no lists)
{summary}                                    (line omitted if null)
{description}
```

Queries are embedded with the same model at request time (`src/lib/retrieve.ts`).

## 6. Database: migration file

Path: `supabase/migrations/20261010000000_places.sql`. Apply it in the Supabase SQL editor (10-DEPLOYMENT step 2). It is idempotent.

Design notes:

- `url` is unique and is the upsert key.
- No vector index (exact scan of ~1,800 rows takes milliseconds and never drops filtered matches).
- RLS is enabled with no policies, so the anon/publishable key can read nothing. The app and loader use the secret key, which maps to `service_role` and bypasses RLS.
- `match_places` is `stable`, pins `search_path` (so `<=>` resolves to pgvector in the `extensions` schema), caps `match_count` at 20, and is executable only by `service_role`.
- Price filter keeps places with unknown price.

```sql
-- Pearl Club chatbot MVP: place corpus + vector search.
-- Apply once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

create extension if not exists vector with schema extensions;

create table if not exists public.places (
  id             bigint generated always as identity primary key,
  url            text not null unique,              -- canonical pearlclub.com URL; idempotency key
  slug           text not null,
  city_slug      text not null,
  city_name      text not null,
  country_code   text,
  country_flag   text,
  category_slug  text not null,
  category_label text not null,
  schema_type    text,
  name           text not null,
  summary        text,                              -- JSON-LD disambiguatingDescription (newer pages only)
  description    text not null,
  price_range    text check (price_range in ('$', '$$', '$$$', '$$$$')),
  price_level    smallint check (price_level between 1 and 4),
  image_urls     text[] not null default '{}',
  website_url    text,
  instagram_url  text,
  map_url        text,
  lat            double precision,
  lng            double precision,
  tags           text[] not null default '{}',
  lists          text[] not null default '{}',
  embedding_text text not null,                     -- exact text that was embedded
  content_hash   text not null,                     -- sha256(embedding model + embedding_text); skip re-embedding when unchanged
  embedding      extensions.vector(1536) not null,  -- text-embedding-3-small
  updated_at     timestamptz not null default now()
);

create index if not exists places_city_category_idx on public.places (city_slug, category_slug);

-- No vector index on purpose: ~1,800 rows is an exact scan in a few milliseconds, and an
-- approximate index (HNSW/IVFFlat) combined with WHERE filters can silently drop matches.
-- Add `using hnsw (embedding extensions.vector_cosine_ops)` only past ~50k rows.

-- RLS on with no policies: only the server's secret key (which bypasses RLS) can read or write.
alter table public.places enable row level security;

create or replace function public.match_places(
  query_embedding   extensions.vector(1536),
  match_count       int default 8,
  filter_city       text default null,
  filter_categories text[] default null,
  max_price_level   int default null,
  exclude_ids       bigint[] default null
)
returns table (
  id             bigint,
  url            text,
  name           text,
  city_slug      text,
  city_name      text,
  country_flag   text,
  category_slug  text,
  category_label text,
  price_range    text,
  price_level    smallint,
  summary        text,
  description    text,
  image_urls     text[],
  website_url    text,
  map_url        text,
  tags           text[],
  lists          text[],
  similarity     double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    p.id, p.url, p.name, p.city_slug, p.city_name, p.country_flag,
    p.category_slug, p.category_label, p.price_range, p.price_level,
    p.summary, p.description, p.image_urls, p.website_url, p.map_url,
    p.tags, p.lists,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.places p
  where (filter_city is null or p.city_slug = filter_city)
    and (filter_categories is null or p.category_slug = any (filter_categories))
    and (max_price_level is null or p.price_level is null or p.price_level <= max_price_level)
    and (exclude_ids is null or not (p.id = any (exclude_ids)))
  order by p.embedding <=> query_embedding
  limit least(match_count, 20);
$$;

-- Only the server (service role / secret key) may call it.
revoke execute on function public.match_places(extensions.vector, int, text, text[], int, bigint[]) from public, anon, authenticated;
grant execute on function public.match_places(extensions.vector, int, text, text[], int, bigint[]) to service_role;
```

## 7. Idempotency

- **Scrape**: HTML is cached per URL in `scraper/.cache/html/{sha1(url)}.html`. Re-running makes network calls only for uncached pages. `places.jsonl` is rewritten from scratch each run, sorted by URL, so identical input gives an identical file.
- **Load**: `content_hash = sha256(embedding model + "\n" + embedding_text)`. `load.py` reads every existing `(url, content_hash)` first and only embeds and upserts rows whose hash is new or changed. A second run with no changes makes zero OpenAI calls.
- Places removed from Pearl Club are not deleted automatically. That is intentional for a demo; delete by URL manually if ever needed.
- Ctrl+C is safe in both scripts: the scraper writes what it has (the cache keeps the rest), the loader stops between batches and resumes on the next run.

## 8. Politeness and rate limiting

- Founder-authorized. `robots.txt` allows everything except `/qr/`.
- 4 worker threads, each sleeping 0.5 s after every request. Pearl Club pages take 1 to 2 s to render, so the effective rate is about 1.5 to 2.5 requests per second. A cold full crawl takes about 25 minutes.
- Explicit timeouts: 10 s connect, 20 s total.
- Up to 3 attempts on 429, 5xx, or network errors, with 5 s, 10 s, 15 s back-off. Any other non-200 is logged and skipped.
- Identifying User-Agent: `PearlClubChatbotMVP/0.1 (founder-authorized test scrape)`.
- Images are never downloaded; cards hot-link the DatoCMS CDN with resize parameters.

## 9. Similarity threshold calibration

`MIN_SIMILARITY` in `src/lib/retrieve.ts` starts at `0.25`. After the full load (task T11), calibrate it once:

1. Run `npm run dev`.
2. Send each query below with curl (04-API-SPEC section 15) and the given city. Read the `retrieval` JSON log line in the dev server output; note the **first** similarity in `results` (the top match). If `results` is empty, temporarily set `MIN_SIMILARITY = 0` and resend.

| # | City | Query | Kind |
|---|---|---|---|
| 1 | london | Romantic dinner with good wine | relevant |
| 2 | paris | A cozy cafe to read in | relevant |
| 3 | new-york-city | Rooftop bar with a view | relevant |
| 4 | los-angeles | Contemporary art gallery | relevant |
| 5 | london | Boutique hotel with character | relevant |
| 6 | paris | Bakery with great croissants | relevant |
| 7 | london | Ski resort with snowboard rental | irrelevant |
| 8 | paris | Car mechanic for a flat tire | irrelevant |
| 9 | new-york-city | Dentist open on Sunday | irrelevant |
| 10 | los-angeles | Cheap flights to Tokyo | irrelevant |

3. Let `R` = the lowest top-1 similarity among queries 1 to 6, and `I` = the highest top-1 similarity among queries 7 to 10.
4. If `I < R`: set `MIN_SIMILARITY` to `(I + R) / 2` rounded to 2 decimals, then clamp it to the range 0.15 to 0.35.
   If `I >= R`: keep `0.25`. The system prompt's "if nothing fits, say so" rule is the second line of defence.
5. Record `R`, `I`, and the chosen value in the commit message (09-GIT-WORKFLOW, checkpoint for T11).

## 10. Code

### `scraper/requirements.txt`

```
httpx==0.28.1
beautifulsoup4==4.15.0
openai==3.28.0
supabase==2.32.0
python-dotenv==1.2.4
```

### `scraper/scrape.py`

```python
"""Scrape Pearl Club place pages for the MVP cities into data/places.jsonl.

Usage:
    python scraper/scrape.py               # all MVP cities (~2,050 URLs, ~20-30 min on a cold cache)
    python scraper/scrape.py --limit 40    # first 40 URLs only, for quick iteration

Re-runnable: raw HTML is cached in scraper/.cache/html, so a second run makes no network calls
for pages already fetched. Delete that directory to force a fresh crawl.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

BASE = "https://www.pearlclub.com"
SITEMAP_INDEX = f"{BASE}/sitemap.xml"
CITIES = [
    "new-york-city",
    "london",
    "paris",
    "los-angeles",
]  # must match src/lib/catalog.ts

# Category slugs (as they appear in the sitemap) whose pages are places. Must match src/lib/catalog.ts.
# Product categories (fashion, jewelry, food, ...) and curator profiles are deliberately absent.
CATEGORY_LABELS = {
    "activities": "Activities",
    "arts-and-culture": "Arts & Culture",
    "bakeries": "Bakeries",
    "bars": "Bars",
    "breakfast": "Breakfast",
    "cafes": "Cafes",
    "dinner": "Dinner",
    "health-and-wellness": "Health & Wellness",
    "kid-friendly": "Kid Friendly",
    "late-night-food": "Late Night Food",
    "live-entertainment": "Live Entertainment",
    "lunch": "Lunch",
    "markets": "Markets",
    "neighborhoods": "Neighborhoods",
    "nightlife": "Nightlife",
    "outdoor-drinks": "Outdoor Drinks",
    "parks-and-nature": "Parks & Nature",
    "services": "Services",
    "shopping": "Shopping",
    "sightseeing": "Sightseeing",
    "stays": "Stays",
    "weekend-trips": "Weekend Trips",
    "workspaces": "Workspaces",
}

# These sitemap path segments 308-redirect to a shorter canonical segment. Request and store the canonical URL.
CANONICAL_PATH_SEGMENT = {
    "arts-and-culture": "arts-culture",
    "health-and-wellness": "health-wellness",
    "parks-and-nature": "parks-nature",
}

SOCIAL_HOSTS = (
    "instagram.com",
    "facebook.com",
    "tiktok.com",
    "x.com",
    "twitter.com",
    "pinterest.com",
)
PLACE_URL_RE = re.compile(
    r"^https://www\.pearlclub\.com/cities/([a-z0-9-]+)/([a-z0-9-]+)/([a-z0-9-]+)$"
)
LOC_RE = re.compile(r"<loc>([^<]+)</loc>")

ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / ".cache" / "html"
OUT_PATH = ROOT.parent / "data" / "places.jsonl"

# Politeness: 4 workers, each pausing 0.5 s after every request. Pages take 1-2 s to render on
# Pearl Club's side, so the real rate is ~1.5-2.5 requests/second.
WORKERS = 4
REQUEST_DELAY_S = 0.5
TIMEOUT = httpx.Timeout(20.0, connect=10.0)
HEADERS = {"User-Agent": "PearlClubChatbotMVP/0.1 (founder-authorized test scrape)"}

log = logging.getLogger("scrape")


def canonical_url(sitemap_url: str) -> str:
    city, category, slug = PLACE_URL_RE.match(sitemap_url).groups()
    return (
        f"{BASE}/cities/{city}/{CANONICAL_PATH_SEGMENT.get(category, category)}/{slug}"
    )


def fetch(client: httpx.Client, url: str) -> str | None:
    """GET with an on-disk cache and 3 attempts on 429/5xx/network errors. None on permanent failure."""
    cache_file = CACHE_DIR / (hashlib.sha1(url.encode()).hexdigest() + ".html")
    if cache_file.exists():
        return cache_file.read_text(encoding="utf-8")
    for attempt in range(1, 4):
        try:
            r = client.get(url)
            time.sleep(REQUEST_DELAY_S)
            if r.status_code == 200:
                cache_file.write_text(r.text, encoding="utf-8")
                return r.text
            if r.status_code in (429, 500, 502, 503, 504):
                log.warning(
                    "retryable status",
                    extra={"url": url, "status": r.status_code, "attempt": attempt},
                )
                time.sleep(5 * attempt)
                continue
            log.warning(
                "non-200, skipping", extra={"url": url, "status": r.status_code}
            )
            return None
        except httpx.HTTPError as e:
            log.warning(
                "network error", extra={"url": url, "error": str(e), "attempt": attempt}
            )
            time.sleep(5 * attempt)
    return None


def discover_place_urls(client: httpx.Client) -> list[str]:
    """sitemap.xml -> sitemap-N.xml children -> place URLs in CITIES and CATEGORY_LABELS (sitemap form)."""
    index = fetch(client, SITEMAP_INDEX) or ""
    children = [u for u in LOC_RE.findall(index) if re.search(r"/sitemap-\d+\.xml$", u)]
    urls: set[str] = set()
    for child in children:
        for loc in LOC_RE.findall(fetch(client, child) or ""):
            m = PLACE_URL_RE.match(loc.strip())
            if m and m.group(1) in CITIES and m.group(2) in CATEGORY_LABELS:
                urls.add(loc.strip())
    return sorted(urls)


def country_flag(code: str | None) -> str | None:
    if not code or len(code) != 2:
        return None
    return "".join(chr(0x1F1E6 + ord(c) - ord("A")) for c in code.upper())


def parse_place(sitemap_url: str, html: str) -> dict | None:
    """One place record, or None when the page has no JSON-LD #place node (stub page or product)."""
    soup = BeautifulSoup(html, "html.parser")
    place = None
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except json.JSONDecodeError:
            continue
        place = next(
            (
                n
                for n in data.get("@graph", [data])
                if str(n.get("@id", "")).endswith("#place")
            ),
            None,
        )
        if place:
            break
    if not place or not place.get("name"):
        return None

    city_slug, category_slug, slug = PLACE_URL_RE.match(sitemap_url).groups()
    address = place.get("address") or {}
    geo = place.get("geo") or {}
    images = place.get("image") or []
    images = [images] if isinstance(images, str) else images
    same_as = place.get("sameAs") or []
    same_as = [same_as] if isinstance(same_as, str) else same_as
    website = next(
        (u for u in same_as if not any(h in urlparse(u).netloc for h in SOCIAL_HOSTS)),
        None,
    )
    instagram = next(
        (u for u in same_as if "instagram.com" in urlparse(u).netloc), None
    )
    price = (
        place.get("priceRange")
        if place.get("priceRange") in ("$", "$$", "$$$", "$$$$")
        else None
    )
    country = {"UK": "GB"}.get(
        address.get("addressCountry"), address.get("addressCountry")
    )  # London uses "UK"
    summary = (place.get("disambiguatingDescription") or "").strip() or None
    description = (place.get("description") or "").strip()
    if description.lower().startswith("lorem ipsum"):
        # CMS placeholder on a handful of pages; the summary holds the real text.
        description, summary = summary or "", None
    if not description:
        return None

    # Tag sections render as:
    #   <p class="mb-2 font-mono text-sm uppercase text-gray-400">Venue Type</p>
    #   <div class="flex flex-wrap gap-2"><a href="/places-cafe"><div>#cafe</div></a>...</div>
    # Labels seen: Appears in, Venue Type, Venue Focus, Venue Features, Cuisine Type, Cuisine Focus,
    # Place Attribute, Target Audience. "Appears in" links to /recommendations/... list pages.
    tags: list[str] = []
    lists: list[str] = []
    for label_p in soup.find_all("p", class_="font-mono"):
        container = label_p.find_next_sibling("div")
        if not container:
            continue
        is_lists = label_p.get_text(strip=True) == "Appears in"
        for a in container.find_all("a", href=True):
            if is_lists and a["href"].startswith("/recommendations/"):
                lists.append(a.get_text(strip=True))
            elif a["href"].startswith("/places-"):
                tags.append(a["href"].removeprefix("/places-"))

    return {
        "url": canonical_url(sitemap_url),
        "slug": slug,
        "city_slug": city_slug,
        "city_name": address.get("addressLocality")
        or city_slug.replace("-", " ").title(),
        "country_code": country,
        "country_flag": country_flag(country),
        "category_slug": category_slug,
        "category_label": CATEGORY_LABELS[category_slug],
        "schema_type": place.get("@type"),
        "name": place["name"].strip(),
        "summary": summary,
        "description": description,
        "price_range": price,
        "price_level": len(price) if price else None,
        "image_urls": images[:5],
        "website_url": website,
        "instagram_url": instagram,
        "map_url": place.get("hasMap"),
        "lat": geo.get("latitude"),
        "lng": geo.get("longitude"),
        "tags": sorted(set(tags)),
        "lists": sorted(set(lists)),
    }


class JsonFormatter(logging.Formatter):
    FIELDS = ("url", "status", "error", "attempt", "count", "done", "total", "skipped")

    def format(self, record: logging.LogRecord) -> str:
        payload = {"level": record.levelname, "msg": record.getMessage()}
        payload.update({k: v for k, v in record.__dict__.items() if k in self.FIELDS})
        return json.dumps(payload)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--limit", type=int, default=0, help="only process the first N place URLs"
    )
    args = parser.parse_args()

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler])
    logging.getLogger("httpx").setLevel(logging.WARNING)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    records: dict[str, dict] = {}
    skipped = 0
    lock = threading.Lock()

    def work(sitemap_url: str) -> dict | None:
        html = fetch(client, canonical_url(sitemap_url))
        return parse_place(sitemap_url, html) if html else None

    with httpx.Client(
        headers=HEADERS, timeout=TIMEOUT, follow_redirects=True
    ) as client:
        urls = discover_place_urls(client)
        if args.limit:
            urls = urls[: args.limit]
        log.info("discovered place urls", extra={"count": len(urls)})
        pool = ThreadPoolExecutor(max_workers=WORKERS)
        try:
            futures = [pool.submit(work, u) for u in urls]
            for i, future in enumerate(as_completed(futures), 1):
                rec = future.result()
                with lock:
                    if rec:
                        records[rec["url"]] = rec
                    else:
                        skipped += 1
                if i % 100 == 0:
                    log.info(
                        "progress",
                        extra={"done": i, "total": len(urls), "skipped": skipped},
                    )
        except KeyboardInterrupt:
            log.warning(
                "interrupted; writing partial output (re-run resumes from cache)"
            )
            pool.shutdown(wait=False, cancel_futures=True)
        else:
            pool.shutdown()

    with OUT_PATH.open("w", encoding="utf-8") as f:
        for url in sorted(records):
            f.write(json.dumps(records[url], ensure_ascii=False) + "\n")
    log.info(
        "wrote data/places.jsonl", extra={"count": len(records), "skipped": skipped}
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### `scraper/load.py`

```python
"""Embed data/places.jsonl and upsert it into Supabase public.places.

Usage:
    python load.py              # embed new/changed places and upsert them
    python load.py --dry-run    # print counts and one example embedding text, write nothing

Idempotent: rows are keyed by url; a place is re-embedded only when its content_hash changes.
Reads OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY from the repo-root .env.local.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from supabase import Client, ClientOptions, create_client

EMBEDDING_MODEL = "text-embedding-3-small"  # 1536 dims; must match src/lib/clients.ts and the migration
BATCH_SIZE = 100

ROOT = Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "places.jsonl"

log = logging.getLogger("load")

# Columns written to public.places (everything in a places.jsonl record plus the three derived ones).
COLUMNS = [
    "url",
    "slug",
    "city_slug",
    "city_name",
    "country_code",
    "country_flag",
    "category_slug",
    "category_label",
    "schema_type",
    "name",
    "summary",
    "description",
    "price_range",
    "price_level",
    "image_urls",
    "website_url",
    "instagram_url",
    "map_url",
    "lat",
    "lng",
    "tags",
    "lists",
]


def embedding_text(p: dict) -> str:
    """The single chunk embedded per place. Descriptions are at most ~2,200 characters, so no chunking."""
    lines = [
        p["name"],
        f'{p["category_label"]} in {p["city_name"]}. Price: {p["price_range"] or "unknown"}.',
    ]
    if p["tags"]:
        lines.append("Tags: " + " ".join(f"#{t}" for t in p["tags"]))
    if p["lists"]:
        lines.append("Featured in: " + "; ".join(p["lists"]))
    if p["summary"]:
        lines.append(p["summary"])
    lines.append(p["description"])
    return "\n".join(lines)


def content_hash(text: str) -> str:
    return hashlib.sha256(f"{EMBEDDING_MODEL}\n{text}".encode()).hexdigest()


def existing_hashes(db: Client) -> dict[str, str]:
    hashes: dict[str, str] = {}
    start = 0
    while True:
        rows = (
            db.table("places")
            .select("url,content_hash")
            .range(start, start + 999)
            .execute()
            .data
        )
        hashes.update({r["url"]: r["content_hash"] for r in rows})
        if len(rows) < 1000:
            return hashes
        start += 1000


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(
        level=logging.INFO, format='{"level": "%(levelname)s", "msg": "%(message)s"}'
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
    load_dotenv(ROOT / ".env.local")

    places = [
        json.loads(line)
        for line in IN_PATH.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    for p in places:
        p["embedding_text"] = embedding_text(p)
        p["content_hash"] = content_hash(p["embedding_text"])
    log.info(f"read {len(places)} places from {IN_PATH.name}")

    if args.dry_run:
        print(places[0]["embedding_text"])
        return 0

    for name in ("OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY"):
        if not os.environ.get(name):
            log.error(
                f"missing env var {name} (expected in .env.local at the repo root)"
            )
            return 1

    openai = OpenAI(timeout=60.0, max_retries=3)
    db = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SECRET_KEY"],
        options=ClientOptions(postgrest_client_timeout=60),
    )

    known = existing_hashes(db)
    todo = [p for p in places if known.get(p["url"]) != p["content_hash"]]
    log.info(f"{len(todo)} new or changed, {len(places) - len(todo)} unchanged")

    done = 0
    try:
        for i in range(0, len(todo), BATCH_SIZE):
            batch = todo[i : i + BATCH_SIZE]
            res = openai.embeddings.create(
                model=EMBEDDING_MODEL, input=[p["embedding_text"] for p in batch]
            )
            rows = [
                {
                    **{c: p[c] for c in COLUMNS},
                    "embedding_text": p["embedding_text"],
                    "content_hash": p["content_hash"],
                    "embedding": d.embedding,
                }
                for p, d in zip(batch, res.data)
            ]
            db.table("places").upsert(rows, on_conflict="url").execute()
            done += len(batch)
            log.info(f"upserted {done}/{len(todo)}")
    except KeyboardInterrupt:
        log.warning(
            f"interrupted after {done} rows; re-run to continue (unchanged rows are skipped)"
        )
        return 130
    log.info("load complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## 11. Running it

From the repo root (Python 3.11 or newer):

```bash
python3 -m venv scraper/.venv
```

```bash
scraper/.venv/bin/pip install -r scraper/requirements.txt
```

```bash
scraper/.venv/bin/python scraper/scrape.py --limit 40
```

```bash
scraper/.venv/bin/python scraper/scrape.py
```

```bash
scraper/.venv/bin/python scraper/load.py --dry-run
```

```bash
scraper/.venv/bin/python scraper/load.py
```

The scraper logs one JSON line per 100 pages and a final `{"msg": "wrote data/places.jsonl", "count": N, "skipped": M}`. The loader logs `upserted X/Y` per batch.

## 12. Verifying the load (Supabase SQL editor)

```sql
select city_slug, count(*) from public.places group by 1 order by 2 desc;
```

Expect four rows summing to the scraper's `count`.

```sql
select count(*) filter (where summary is not null) as with_summary,
       count(*) filter (where cardinality(tags) > 0) as with_tags,
       count(*) filter (where image_urls = '{}') as without_images,
       count(*) as total
from public.places;
```

```sql
select name, category_slug, price_range, url from public.places where name ilike '%burgh house%';
```

Expect one London row whose `url` opens the live Pearl Club page.
