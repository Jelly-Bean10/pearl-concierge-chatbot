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
    "new-york-city", "london", "paris", "los-angeles",
    "berlin", "san-francisco", "austin", "barcelona", "amsterdam", "lisbon", "tokyo", "miami",
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
CURATOR_HREF_RE = re.compile(r"^/cities/[a-z0-9-]+/curators/[a-z0-9-]+$")
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

    # "Curator spotlight": the local who recommends this place. Pages credited only to Pearl Club itself
    # (/cities/global/curators/pearl-club) get no curator.
    curator_name = curator_url = curator_avatar = None
    spotlight = soup.find(
        lambda t: t.name in ("h2", "h3") and "Curator spotlight" in t.get_text()
    )
    link = (
        spotlight.find_next("a", href=CURATOR_HREF_RE) if spotlight else None
    )
    if link and not link["href"].startswith("/cities/global/"):
        names = list(link.stripped_strings)
        curator_name = names[0] if names else None
        curator_url = BASE + link["href"]
        avatar = next(
            (i["src"] for i in link.find_all("img", src=True) if i["src"].startswith("https://")),
            None,
        )
        curator_avatar = avatar.split("?")[0] if avatar else None

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
        "curator_name": curator_name,
        "curator_url": curator_url,
        "curator_avatar": curator_avatar,
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
