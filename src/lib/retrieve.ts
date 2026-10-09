import "server-only";
import { EMBEDDING_MODEL, getOpenAI, getSupabase } from "./clients";
import type { Plan } from "./planner";
import type { CitySlug, PlaceCard } from "./types";

const EMBED_TIMEOUT_MS = 8_000;
const MATCH_COUNT = 8; // candidates handed to the model
const MIN_RESULTS_BEFORE_RELAXING = 3;
// Cosine similarity floor. Calibrate with the procedure in docs/03-DATA-PIPELINE.md section 9.
export const MIN_SIMILARITY = 0.25;

/** Row returned by the match_places SQL function. */
export interface PlaceRow {
  id: number;
  url: string;
  name: string;
  city_slug: CitySlug;
  city_name: string;
  country_flag: string | null;
  category_slug: string;
  category_label: string;
  price_range: string | null;
  price_level: number | null;
  summary: string | null;
  description: string;
  image_urls: string[];
  website_url: string | null;
  map_url: string | null;
  tags: string[];
  lists: string[];
  similarity: number;
}

async function embed(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create(
    { model: EMBEDDING_MODEL, input: text },
    { signal: AbortSignal.timeout(EMBED_TIMEOUT_MS) },
  );
  return res.data[0].embedding;
}

async function matchPlaces(
  embedding: number[],
  city: CitySlug,
  categories: string[] | null,
  maxPriceLevel: number | null,
  excludeIds: number[],
): Promise<PlaceRow[]> {
  const { data, error } = await getSupabase().rpc("match_places", {
    query_embedding: embedding, // PostgREST passes the JSON array to pgvector, which parses it as a vector
    match_count: MATCH_COUNT,
    filter_city: city,
    filter_categories: categories && categories.length > 0 ? categories : null,
    max_price_level: maxPriceLevel,
    exclude_ids: excludeIds.length > 0 ? excludeIds : null,
  });
  if (error) throw new Error(`match_places failed: ${error.message}`);
  return ((data ?? []) as PlaceRow[]).filter((r) => r.similarity >= MIN_SIMILARITY);
}

/**
 * Embed the planner's search query and fetch up to MATCH_COUNT places in the plan's city.
 * If the category/price filters leave fewer than 3 results, retry once without them and append.
 */
export async function retrievePlaces(plan: Plan, excludeIds: number[]): Promise<PlaceRow[]> {
  if (!plan.city) return [];
  const embedding = await embed(plan.searchQuery);
  let rows = await matchPlaces(embedding, plan.city, plan.categories, plan.maxPriceLevel, excludeIds);

  const filtered = plan.categories.length > 0 || plan.maxPriceLevel !== null;
  if (rows.length < MIN_RESULTS_BEFORE_RELAXING && filtered) {
    const relaxed = await matchPlaces(embedding, plan.city, null, null, excludeIds);
    const seen = new Set(rows.map((r) => r.id));
    rows = [...rows, ...relaxed.filter((r) => !seen.has(r.id))].slice(0, MATCH_COUNT);
  }
  console.log(
    JSON.stringify({
      event: "retrieval",
      city: plan.city,
      query: plan.searchQuery,
      categories: plan.categories,
      maxPriceLevel: plan.maxPriceLevel,
      results: rows.map((r) => [r.name, Number(r.similarity.toFixed(3))]),
    }),
  );
  return rows;
}

/** datocms-assets.com is imgix-backed: resize and recompress on the CDN. */
export function cardImage(url: string | undefined): string | null {
  return url ? `${url}?auto=format&fit=crop&w=600&h=450&q=70` : null;
}

export function toCard(row: PlaceRow, ref: number): PlaceCard {
  return {
    id: row.id,
    ref,
    url: row.url,
    name: row.name,
    citySlug: row.city_slug,
    cityName: row.city_name,
    countryFlag: row.country_flag,
    categorySlug: row.category_slug,
    categoryLabel: row.category_label,
    priceRange: row.price_range,
    summary: row.summary ?? truncate(row.description, 180),
    imageUrl: cardImage(row.image_urls[0]),
    websiteUrl: row.website_url,
    mapUrl: row.map_url,
    tags: row.tags.slice(0, 3),
  };
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).trimEnd() + "…";
}
