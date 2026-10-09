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
