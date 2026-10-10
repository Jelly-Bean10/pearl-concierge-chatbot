import { CITIES } from "@/lib/catalog";
import type { CitySlug } from "@/lib/types";

interface Props {
  city: CitySlug | null;
  onCity: (city: CitySlug | null) => void;
  onReset?: () => void;
}

export default function Header({ city, onCity, onReset }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[720px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[22px] font-semibold leading-none text-ink">Pearl Club</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Concierge</span>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted hover:text-ink"
          >
            New chat
          </button>
        )}
      </div>
      <div className="pearl-gradient h-[3px]" aria-hidden />
      <nav aria-label="City" className="mx-auto w-full max-w-[720px]">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2.5 [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)] sm:px-6">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">City</span>
          {CITIES.map((c) => {
            const active = c.slug === city;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={active}
                onClick={() => onCity(active ? null : c.slug)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  active ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink"
                }`}
              >
                <span aria-hidden>{c.flag}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
