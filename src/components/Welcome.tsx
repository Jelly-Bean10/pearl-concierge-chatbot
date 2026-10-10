import { cityBySlug } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";
import type { CitySlug } from "@/lib/types";
import { ArrowRight } from "./icons";

interface Props {
  t: Dict;
  city: CitySlug | null;
  onPick: (prompt: string) => void;
}

export default function Welcome({ t, city, onPick }: Props) {
  const name = cityBySlug(city)?.name;

  return (
    <section className="flex flex-col gap-10 pt-6 sm:pt-14">
      <div className="flex flex-col gap-4">
        <h1 className="text-balance font-display text-[40px] font-medium leading-[44px] tracking-[-0.02em] text-ink sm:text-[56px] sm:leading-[58px]">
          {t.welcomeTitle(name)}
        </h1>
        <p className="max-w-[46ch] text-[17px] leading-7 text-ink-soft">{t.welcomeBody}</p>
      </div>
      <ul className="border-t border-line">
        {t.starters.map((s) => (
          <li key={s.label} className="border-b border-line">
            <button
              type="button"
              onClick={() => onPick(s.prompt(name))}
              className="group flex min-h-16 w-full items-center gap-4 py-4 text-start"
            >
              <span className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="text-[17px] font-semibold leading-6 text-ink">{s.label}</span>
                <span className="text-sm leading-5 text-muted">{s.hint}</span>
              </span>
              <ArrowRight
                size={18}
                className="shrink-0 text-muted transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-ink rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
