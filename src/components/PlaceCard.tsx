import { REQUESTABLE_CATEGORIES } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";
import type { PlaceCard as Place } from "@/lib/types";
import { ArrowRight, ArrowUpRight } from "./icons";

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

interface Props {
  place: Place;
  domId: string;
  t: Dict;
  onRequest?: () => void;
}

export default function PlaceCard({ place, domId, t, onRequest }: Props) {
  const requestable = REQUESTABLE_CATEGORIES.has(place.categorySlug);

  return (
    <article
      id={domId}
      className="flex w-[272px] shrink-0 snap-start scroll-mt-24 flex-col overflow-hidden rounded-xl border border-line bg-paper sm:w-[232px]"
    >
      <a href={place.url} {...external} className="relative block aspect-[3/2] bg-mist" tabIndex={-1} aria-hidden>
        {place.imageUrl ? (
          // Plain <img>: the CDN (imgix) already resizes; next/image would add config for no gain.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-5xl text-muted">
            {place.name[0]}
          </span>
        )}
        {place.priceRange && (
          <span className="absolute end-2 top-2 rounded-md bg-paper/90 px-1.5 py-0.5 font-mono text-[11px] text-ink">
            {place.priceRange}
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {t.categories[place.categorySlug] ?? place.categoryLabel} · {place.cityName}
        </p>
        <h3 className="font-display text-[22px] font-semibold leading-[26px] text-ink">
          <a href={place.url} {...external} className="hover:underline hover:decoration-1 hover:underline-offset-4">
            {place.name}
          </a>
        </h3>
        <p className="line-clamp-3 text-sm leading-5 text-ink-soft">{place.summary}</p>

        {place.curator && (
          <a
            href={place.curator.url}
            {...external}
            className="-my-1 flex min-h-10 items-center gap-2 text-[13px] text-ink-soft hover:text-ink"
          >
            {place.curator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={place.curator.avatarUrl}
                alt=""
                loading="lazy"
                className="h-6 w-6 shrink-0 rounded-full bg-mist object-cover"
              />
            ) : null}
            <span>{t.pickedBy(place.curator.name)}</span>
          </a>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <a
            href={place.url}
            {...external}
            className="flex h-11 items-center justify-center gap-2 rounded-md bg-ink font-mono text-xs uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink-soft"
          >
            {t.viewOnPearl}
            <ArrowRight size={14} className="rtl:-scale-x-100" />
          </a>
          {requestable && (
            <button
              type="button"
              onClick={onRequest}
              disabled={!onRequest}
              className="h-11 rounded-md border border-line font-mono text-xs uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink disabled:opacity-50"
            >
              {t.requestThis}
            </button>
          )}
          {(place.websiteUrl || place.mapUrl) && (
            <div className="flex justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {place.websiteUrl && (
                <a href={place.websiteUrl} {...external} className="flex min-h-10 items-center gap-1 hover:text-ink">
                  {t.website}
                  <ArrowUpRight size={12} className="rtl:-scale-x-100" />
                </a>
              )}
              {place.mapUrl && (
                <a href={place.mapUrl} {...external} className="flex min-h-10 items-center gap-1 hover:text-ink">
                  {t.map}
                  <ArrowUpRight size={12} className="rtl:-scale-x-100" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
