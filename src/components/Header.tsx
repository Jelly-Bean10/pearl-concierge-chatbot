import { CITIES } from "@/lib/catalog";
import { LANGS, type Dict, type Lang } from "@/lib/i18n";
import type { CitySlug } from "@/lib/types";

interface Props {
  t: Dict;
  lang: Lang;
  onLang: (lang: Lang) => void;
  city: CitySlug | null;
  onCity: (city: CitySlug | null) => void;
  onReset?: () => void;
}

export default function Header({ t, lang, onLang, city, onCity, onReset }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[720px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="font-display text-[22px] font-semibold leading-none text-ink">Pearl Club</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.08em] text-muted sm:inline">
            {t.concierge}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label className="relative flex h-10 items-center gap-1.5 rounded-full border border-line pe-2 ps-2.5 text-sm text-ink focus-within:border-ink hover:border-ink">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
            </svg>
            <span className="sr-only">{t.language}</span>
            <select
              value={lang}
              onChange={(e) => onLang(e.target.value as Lang)}
              className="cursor-pointer appearance-none bg-transparent pe-1 text-sm font-medium outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="-me-2 min-h-10 px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted hover:text-ink"
            >
              {t.newChat}
            </button>
          )}
        </div>
      </div>
      <div className="pearl-gradient h-[3px]" aria-hidden />
      <nav aria-label={t.city} className="mx-auto w-full max-w-[720px]">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2.5 [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)] sm:px-6">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t.city}</span>
          {CITIES.map((c) => {
            const active = c.slug === city;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={active}
                onClick={() => onCity(active ? null : c.slug)}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
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
