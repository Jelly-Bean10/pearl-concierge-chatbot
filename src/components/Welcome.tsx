import { cityBySlug } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";
import type { CitySlug } from "@/lib/types";

interface Props {
  t: Dict;
  city: CitySlug | null;
  onPick: (prompt: string) => void;
}

export default function Welcome({ t, city, onPick }: Props) {
  const name = cityBySlug(city)?.name;

  return (
    <section className="flex flex-col gap-8 pt-4 sm:pt-10">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t.welcomeLabel}</p>
        <h1 className="font-display text-[34px] font-medium leading-[38px] tracking-[-0.01em] text-ink sm:text-[44px] sm:leading-[48px]">
          {t.welcomeTitle(name)}
        </h1>
        <p className="max-w-[52ch] text-base leading-[26px] text-ink-soft">{t.welcomeBody}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {t.starters.map((s) => (
          <button
            key={s.emoji}
            type="button"
            onClick={() => onPick(s.prompt(name))}
            className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 text-start transition-colors hover:border-ink hover:bg-mist"
          >
            <span className="text-xl leading-6" aria-hidden>
              {s.emoji}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold leading-6 text-ink">{s.label}</span>
              <span className="text-sm leading-5 text-muted">{s.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
