import type { PlaceCard as Place } from "@/lib/types";

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function PlaceCard({ place, domId }: { place: Place; domId: string }) {
  return (
    <article
      id={domId}
      className="flex w-[264px] shrink-0 snap-start sm:w-[216px] flex-col overflow-hidden rounded-xl border border-line bg-paper"
    >
      <a href={place.url} {...external} className="relative block aspect-[4/3] bg-mist" tabIndex={-1} aria-hidden>
        {place.imageUrl ? (
          // Plain <img>: the CDN (imgix) already resizes; next/image would add config for no gain.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-5xl text-muted">
            {place.name[0]}
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] text-paper">
          {String(place.ref).padStart(2, "0")}
        </span>
        {place.priceRange && (
          <span className="absolute right-2 top-2 rounded-md bg-paper/90 px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink">
            {place.priceRange}
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {place.countryFlag} {place.categoryLabel} · {place.cityName}
        </p>
        <h3 className="font-display text-[22px] font-semibold leading-[26px] text-ink">
          <a href={place.url} {...external} className="hover:underline">
            {place.name}
          </a>
        </h3>
        <p className="line-clamp-3 text-sm leading-5 text-ink-soft">{place.summary}</p>
        {place.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {place.tags.map((tag) => (
              <li key={tag} className="rounded-xl bg-ink px-2 py-0.5 text-[11px] lowercase text-paper">
                #{tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <a
            href={place.url}
            {...external}
            className="flex h-10 items-center justify-center rounded-md bg-ink font-mono text-xs uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink-soft"
          >
            View on Pearl Club →
          </a>
          {(place.websiteUrl || place.mapUrl) && (
            <div className="flex justify-center gap-5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {place.websiteUrl && (
                <a href={place.websiteUrl} {...external} className="hover:text-ink">
                  Website ↗
                </a>
              )}
              {place.mapUrl && (
                <a href={place.mapUrl} {...external} className="hover:text-ink">
                  Map ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
