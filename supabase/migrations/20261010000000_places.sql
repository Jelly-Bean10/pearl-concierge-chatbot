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

-- RLS on with no policies: nobody can read or write the table directly through the API.
-- Reads happen only through match_places() below (security definer); writes only with a service key.
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
security definer
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

-- Callable with the publishable (anon) key: it is read-only, returns at most 20 rows, and the data is
-- already public on pearlclub.com. No write path exists for anon.
revoke execute on function public.match_places(extensions.vector, int, text, text[], int, bigint[]) from public;
grant execute on function public.match_places(extensions.vector, int, text, text[], int, bigint[]) to anon, authenticated, service_role;
