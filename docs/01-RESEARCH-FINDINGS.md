# 01 · Research Findings

Everything below was verified against the live pearlclub.com on 2026-10-10 with plain HTTP requests (no browser needed). Pearl Club was formerly called Tipsiti; its JSON-LD still lists `"alternateName": "Tipsiti"` and `"legalName": "Tipsiti LLC."`.

## 1. Decisions this research drove

| Decision | Because |
|---|---|
| Discover places from the XML sitemaps, not from listing pages | City and category listing pages are client-rendered; their HTML contains only ~4 place links. `sitemap-0.xml` and `sitemap-1.xml` list every place URL. |
| Extract from JSON-LD, not the DOM | Every real place page has a complete schema.org `#place` node (name, two descriptions, images, geo, price, links). It is the cleanest, most stable source. |
| Use the DOM only for tags and "Appears in" lists | JSON-LD has no tags. They are in a small, consistently marked-up block. |
| Skip pages with no `#place` node | About 12% of place URLs are stubs (title and meta only), and product pages share the URL pattern but carry an `Article` node. |
| MVP cities: New York City, London, Paris, Los Angeles | The four densest cities that also have the newer, long-form descriptions (1,200 to 2,200 characters plus a curated summary). Berlin is dense but mostly older 200-character blurbs. |
| Request canonical URLs directly | Three category segments 308-redirect; requesting the canonical form halves requests for those pages and gives the right link. |
| Map country code `UK` to `GB` | London pages use the non-ISO `UK`, which produces a broken flag emoji. |
| Hot-link images through imgix params | Images are on `datocms-assets.com` (imgix). `?auto=format&fit=crop&w=600&h=450&q=70` cuts a 1.2 MB JPEG to about 66 KB. |
| 4 workers with a 0.5 s pause each | Pages take 1 to 2 s to render server-side; a single sequential crawler would take over an hour. |

## 2. Crawling rules

The bare domain redirects to `https://www.pearlclub.com/`. `robots.txt`:

```
User-agent: *
Allow: /
Disallow: /qr/
Host: https://www.pearlclub.com
Sitemap: https://www.pearlclub.com/sitemap.xml
Sitemap: https://www.pearlclub.com/recommendations-sitemap.xml
Sitemap: https://www.pearlclub.com/products-sitemap.xml
Sitemap: https://www.pearlclub.com/places-sitemap.xml
... (plus bloggers, conferences, industry-professionals, influencers, tech-providers,
     tour-operators, tourism-boards, travel-advisors, travel-agencies, travel-associations)
```

The founder explicitly permitted scraping for this project. Always use `https://www.pearlclub.com` (with `www`).

## 3. URL structure

| Pattern | Example | What it is | Used? |
|---|---|---|---|
| `/cities/{city}/{category}/{slug}` | `/cities/lisbon/dinner/la-joya-cantina` | Place page (or product page under product categories) | **Yes**, the corpus |
| `/cities/{city}` | `/cities/lisbon` | City landing (client-rendered list) | No |
| `/cities/{city}/{category}` | `/cities/lisbon/dinner` | Category list (client-rendered) | No |
| `/cities/{city}/curators/{name}` | `/cities/berlin/curators/daniella-h` | Curator profile (no `#place`) | No |
| `/recommendations/{list}` | `/recommendations/cheap-bars-in-berlin`, `/recommendations/places-in-lisbon-datenight` | Curated list pages; their names appear in each place's "Appears in" | Names only |
| `/places-{tag}` | `/places-divebar` | Global tag page | Tag slug only |
| `/{category}-in-{city}` | `/bars-in-monterey`, `/food-in-hamburg` | SEO landing pages (places-sitemap, products-sitemap) | No |

Sitemap structure: `sitemap.xml` is an index of 15 sitemaps. `sitemap-0.xml` (5,000 URLs) and `sitemap-1.xml` (3,740 URLs) together hold 7,818 URLs of the form `/cities/{city}/{category}/{slug}` across 104 cities (151 city landing pages exist).

Redirects (verified with one URL each; all other place categories return 200 directly):

| Sitemap URL segment | Redirects (308) to |
|---|---|
| `/arts-and-culture/` | `/arts-culture/` |
| `/health-and-wellness/` | `/health-wellness/` |
| `/parks-and-nature/` | `/parks-nature/` |

## 4. Inventory and city choice

Place-pattern URLs per city in the sitemaps (top 15 of 104):

| City | URLs | | City | URLs |
|---|---|---|---|---|
| new-york-city | 763 | | lisbon | 166 |
| london | 707 | | portland | 165 |
| berlin | 553 | | miami | 165 |
| los-angeles | 345 | | amsterdam | 162 |
| paris | 344 | | toronto | 160 |
| austin | 325 | | tokyo | 159 |
| san-francisco | 256 | | munich | 153 |
| bangkok | 237 | | | |
| stockholm | 178 | | | |

Content quality sample (8 random URLs per city, 2026-10-10):

| City | Pages with `#place` | With `disambiguatingDescription` | With tags | Median description length |
|---|---|---|---|---|
| new-york-city | 7/8 | 6 | 4 | 1,445 |
| london | 7/8 | 6 | 3 | 1,405 |
| paris | 6/8 | 6 | 6 | 1,397 |
| los-angeles | 7/8 | 5 | 5 | 1,370 |
| mexico-city | 5/8 | 3 | 2 | 1,424 |
| berlin | 7/8 | 1 | 4 | 204 |
| lisbon | 7/8 | 1 | 3 | 214 |
| tokyo | 6/8 | 1 | 2 | 213 |

Chosen: **New York City, London, Paris, Los Angeles** (dense, rich, and globally recognisable for a demo).

Category counts across the whole site (place-pattern URLs): dinner 2,063 · bars 735 · arts-and-culture 643 · lunch 522 · cafes 519 · shopping 370 · stays 335 · bakeries 266 · sightseeing 216 · weekend-trips 215 · parks-and-nature 199 · breakfast 195 · neighborhoods 180 · activities 157 · live-entertainment 130 · markets 124 · health-and-wellness 105 · outdoor-drinks 94 · curators 89 · fashion 73 · late-night-food 69 · home-goods 69 · kid-friendly 65 · services 54 · nightlife 53 · food 46 · drinks 46 · accessories 35 · shoes 30 · beauty 24 · workspaces 18 · jewelry 16 · wellness 11 · and 13 smaller product categories.

Place categories (kept, 23): activities, arts-and-culture, bakeries, bars, breakfast, cafes, dinner, health-and-wellness, kid-friendly, late-night-food, live-entertainment, lunch, markets, neighborhoods, nightlife, outdoor-drinks, parks-and-nature, services, shopping, sightseeing, stays, weekend-trips, workspaces.

Excluded: `curators` (profiles) and product categories (accessories, art, beauty, books, drinks, fashion, food, games, garden, home-goods, jewelry, music, online-boutiques, outdoors, pet-supplies, shoes, sports, stationery, toys, travel, guides, wellness), verified to carry an `Article` node or no `#place` node.

### Final scrape (2026-10-10, MVP cities)

`scrape.py` discovered 2,051 URLs and wrote **1,785 places**; 266 URLs (13%) had no `#place` node and were skipped. No request failed or needed a retry. A cold crawl took about 25 minutes with 4 workers; a re-run from cache takes seconds and produces an identical file.

| City | Places |
|---|---|
| new-york-city | 635 |
| london | 601 |
| paris | 282 |
| los-angeles | 267 |

| Category | Places | | Category | Places |
|---|---|---|---|---|
| dinner | 651 | | health-and-wellness | 27 |
| bars | 187 | | live-entertainment | 24 |
| cafes | 166 | | sightseeing | 24 |
| arts-and-culture | 148 | | activities | 22 |
| bakeries | 110 | | parks-and-nature | 22 |
| lunch | 104 | | late-night-food | 19 |
| shopping | 92 | | services | 13 |
| stays | 53 | | nightlife | 10 |
| markets | 35 | | kid-friendly | 6 |
| breakfast | 32 | | weekend-trips | 6 |
| neighborhoods | 28 | | outdoor-drinks | 5 |
| | | | workspaces | 1 |

Field coverage: summary 84%, tags 61%, lists 99%, website 98%, images 100% (none missing), map link 100%, coordinates 100%. Price: `$$` 791, `$` 604, `$$$$` 217, `$$$` 173. Description length: median 1,376 characters, max 2,179. Five pages have the CMS placeholder `lorem ipsum` as their description (e.g. Red Rooster, Grand Central in New York City); the scraper uses their summary instead.

Most common tags: datenight (405), restaurant (381), outdoorseating (217), goodforgroups (212), dinner (211), specialoccasions (186), neighbourhoodgem (184), cocktails (183), historic (147), french (131), cafe (126), solodining (125), architecture (122), pastries (119).

Not in the corpus (useful for QA): no place named "Ritz", "McDonald's", or "Jules Verne".

## 5. Place page data

### JSON-LD

One `<script type="application/ld+json">` per page. Top level: `{"@context": "https://schema.org", "@graph": [WebPage, <place>, ItemList, BreadcrumbList]}`. The place node is the one whose `@id` ends with `#place`. Complete real example (`/cities/lisbon/dinner/la-joya-cantina`):

```json
{
  "@type": "Restaurant",
  "@id": "https://www.pearlclub.com/cities/lisbon/dinner/la-joya-cantina/#place",
  "name": "La Joya Cantina",
  "description": "The dining room at La Joya Cantina is intentionally sparse. With unadorned walls and tightly packed square tables, the focus stays on the stainless steel platters of food moving out of the kitchen. ... getting a seat requires booking well ahead of time.",
  "disambiguatingDescription": "Intimate, dimly lit Argentine cantina serving comforting empanadas and milanesa on simple stainless steel platters. The minimal dining room packs tight and runs loud through the evening rush.",
  "image": [
    "https://www.datocms-assets.com/55798/1790303501-la-joya-cantina-1.jpeg",
    "https://www.datocms-assets.com/55798/1790303501-la-joya-cantina-2.jpeg",
    "https://www.datocms-assets.com/55798/1790303501-la-joya-cantina-3.jpeg",
    "https://www.datocms-assets.com/55798/1790303501-la-joya-cantina-4.jpeg",
    "https://www.datocms-assets.com/55798/1790303501-la-joya-cantina-5.jpeg"
  ],
  "url": "https://www.pearlclub.com/cities/lisbon/dinner/la-joya-cantina",
  "hasMap": "https://www.google.com/maps/place/data=!3m1!4b1!4m2!3m1!1s0xd19350ff4c2832b:0xc52ece3307f79f75",
  "sameAs": [
    "https://letsumai.com/widget/la-joya-cantina",
    "https://www.instagram.com/lajoya_cantina",
    "https://www.instagram.com/explore/locations/481516828368373"
  ],
  "address": {
    "@type": "PostalAddress",
    "@id": "https://www.pearlclub.com/cities/lisbon/#page",
    "url": "https://www.pearlclub.com/cities/lisbon",
    "addressLocality": "Lisbon",
    "addressCountry": "PT"
  },
  "geo": { "@type": "GeoCoordinates", "longitude": -9.15148, "latitude": 38.7121 },
  "priceRange": "$$"
}
```

(The real `description` has three paragraphs separated by `\n\n`; it is shortened here.)

Field notes:

- `@type` seen across the MVP corpus: `Restaurant` (806), `BarOrPub` (192), `TouristAttraction` (172), `CafeOrCoffeeShop` (166), `LocalBusiness` (118), `Bakery` (110), `LodgingBusiness` (53), `ShoppingCenter` (35), `City` (28, neighborhoods), `HealthClub` (27), `EventVenue` (24), `Place` (22), and a few others. Never select by type.
- `disambiguatingDescription` exists only on newer pages. Older pages (e.g. `/cities/berlin/bars/mobel-olfe`, `/cities/london/stays/the-buxton`) have a ~200 to 230 character `description` and no summary.
- `image` is an array of 2 to 5 DatoCMS URLs.
- `sameAs` mixes the venue website, booking widgets, and Instagram links. The first non-social entry is treated as the website.
- `priceRange` is always one of `$`, `$$`, `$$$`, `$$$$` on the sampled pages.
- Not available anywhere on the page: opening hours, street address, phone. The prompt therefore forbids stating them.
- `address.addressCountry` uses `"UK"` for London (not ISO).
- `WebPage.description` is boilerplate ("All the informaton you need to know about ..."). Ignore it.
- The `BreadcrumbList` gives "Home > Berlin > Bars in Berlin > Möbel-Olfe". Not needed; city and category come from the URL.

### Tag and list sections (HTML)

```html
<p class="mb-2 font-mono text-sm uppercase text-gray-400">Appears in</p>
<div class="flex flex-wrap gap-2">
  <a class="no-underline" href="/recommendations/cheap-bars-in-berlin"><div ...>Best Cheap Bars in Berlin</div></a>
  <a class="no-underline" href="/recommendations/places-in-berlin-divebar"><div ...>Best Dive Bars in Berlin</div></a>
</div>
<p class="mb-2 font-mono text-sm uppercase text-gray-400">Venue Type</p>
<div class="flex flex-wrap gap-2">
  <a class="no-underline" href="/places-divebar"><div ...>#divebar</div></a>
</div>
```

Labels observed: `Appears in`, `Venue Type`, `Venue Focus`, `Venue Features`, `Cuisine Type`, `Cuisine Focus`, `Place Attribute`, `Target Audience`. Example tag slugs: `cafe`, `tea`, `ceramics`, `japanese`, `neighbourhoodgem`, `stylishspace`, `solodining`, `datenight`, `cosyplace`, `vegetarianfriendly`, `goodforgroups`, `kidfriendly`, `rooftop`, `hotel`, `historic`, `architecture`.

Other HTML on the page (not used): curator spotlight (`/cities/{city}/curators/{name}`), photo credits, "Claim this place", and a large client-side filter UI whose hashtags (`#arcadegames`, `#bakedgoods`, ...) are buttons, not `/places-` links, so they never pollute the tag extraction.

### Stub pages

About 12% of place URLs return 200 with a full page shell but no JSON-LD and no content, only `<title>` and `og:description`. Example: `/cities/london/bakeries/willy-s-pies`. They are skipped.

### Product pages

Same URL pattern under product categories (e.g. `/cities/paris/fashion/baby-fox-merino-regular-jumper`). Their graph has an `Article` node instead of `#place`. Excluded by category and by the `#place` rule.

## 6. Images

DatoCMS assets on `www.datocms-assets.com`, served through imgix:

| URL | Bytes |
|---|---|
| `.../1790303501-la-joya-cantina-1.jpeg` | 1,206,156 |
| `.../1790303501-la-joya-cantina-1.jpeg?auto=format&fit=crop&w=600&h=450` | 66,342 |

## 7. Brand findings (from Pearl Club's CSS bundles)

| Item | Value |
|---|---|
| Display font | Cormorant (Google Fonts), weight 300 to 600 |
| Body font | Karla (Google Fonts) |
| Label font | Space Mono (Google Fonts), used uppercase |
| Accent gradient | `linear-gradient(90deg, hsl(243 100% 68%), hsl(359 100% 65%))` (`--pearlclub-gradient-blue`, `--pearlclub-gradient-red`); also `--pearlclub-gradient-gold: 41 91% 56%` |
| Section grey | `--pearlclub-gray-150: #f2f2f2` |
| Tag pills | `bg-[#121113] rounded-xl lowercase text-white text-xs` |
| Section labels | `font-mono text-sm uppercase text-gray-400` |
| Flags | Emoji flags next to city names |

05-DESIGN-SYSTEM turns these into tokens.

## 8. Reference products

| Product | Observed (2026-10-10) | Borrowed | Not borrowed |
|---|---|---|---|
| Layla.ai | Home page leads with example prompts ("Ask Layla to plan Tokyo in 6 days: food, culture & bucket-list stops"), a single "Start planning" entry, trip cards made for named travellers | Starter cards that show what to ask; recommendation cards as the main payload | Multi-day itinerary builder, flights, account wall |
| Chatbase | Simple chat bubble widget, suggested messages, an explicit instructions + guardrails model ("Avoid promising...") | Suggested follow-up chips; explicit guardrails in the system prompt; plain bubbles for user messages | Multi-channel deployment, actions/tools, dashboards |
| Wonderplan.ai, DialogShift | Not separately researched; cited in the brief for personalised planning and hotel-guest chat | Conversation-aware personalisation (city, budget, mood carried across turns) | Itineraries, hotel PMS integrations, booking |

## 9. Quick reference

| What | Where |
|---|---|
| Place URL list | `sitemap.xml` > `sitemap-0.xml`, `sitemap-1.xml` > `<loc>` matching `/cities/{city}/{category}/{slug}` |
| Place data | `script[type="application/ld+json"]` > `@graph[]` where `@id` ends with `#place` |
| Name | `#place.name` |
| Summary | `#place.disambiguatingDescription` (optional) |
| Description | `#place.description` |
| Images | `#place.image[]` |
| Price | `#place.priceRange` |
| Coordinates | `#place.geo.latitude`, `#place.geo.longitude` |
| City / country | `#place.address.addressLocality`, `#place.address.addressCountry` |
| Website / Instagram | `#place.sameAs[]` |
| Map link | `#place.hasMap` |
| Tags | `p.font-mono` + next sibling `div` > `a[href^="/places-"]` |
| Lists | `p.font-mono` with text `Appears in` + next sibling `div` > `a[href^="/recommendations/"]` text |
