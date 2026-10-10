-- The local curator who recommends each place ("Curator spotlight" on the Pearl Club page).
-- Null when a place is credited only to Pearl Club itself.

alter table public.places
  add column if not exists curator_name   text,
  add column if not exists curator_url    text,
  add column if not exists curator_avatar text;

-- The return type changes, so the function has to be dropped and recreated.
drop function if exists public.match_places(extensions.vector, int, text, text[], int, bigint[]);

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
  curator_name   text,
  curator_url    text,
  curator_avatar text,
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
    p.tags, p.lists, p.curator_name, p.curator_url, p.curator_avatar,
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
