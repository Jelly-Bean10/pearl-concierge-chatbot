import { cityBySlug } from "@/lib/catalog";
import type { CitySlug } from "@/lib/types";

interface Props {
  city: CitySlug | null;
  onPick: (prompt: string) => void;
}

export default function Welcome({ city, onPick }: Props) {
  const name = cityBySlug(city)?.name;
  const inCity = name ? ` in ${name}` : "";
  const starters = [
    {
      emoji: "💎",
      label: "Find hidden gems",
      hint: "Local favourites, off the tourist trail",
      prompt: `Find me some hidden gems${inCity}`,
    },
    {
      emoji: "🎟️",
      label: "Book an experience",
      hint: "Tours, shows, classes and culture",
      prompt: `I want to book an experience${inCity}`,
    },
    {
      emoji: "🍽️",
      label: "Dinner tonight",
      hint: "From neighbourhood spots to special nights",
      prompt: `Where should I have dinner tonight${inCity}?`,
    },
    { emoji: "🛏️", label: "Where to stay", hint: "Hotels with character", prompt: `Where should I stay${inCity}?` },
  ];

  return (
    <section className="flex flex-col gap-8 pt-4 sm:pt-10">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Hi, I&apos;m Pearl</p>
        <h1 className="font-display text-[34px] font-medium leading-[38px] tracking-[-0.01em] text-ink sm:text-[44px] sm:leading-[48px]">
          Where are you headed{name ? ` in ${name}` : ""}?
        </h1>
        <p className="max-w-[52ch] text-base leading-[26px] text-ink-soft">
          Ask me for places hand-picked by Pearl Club&apos;s local curators. Every suggestion links to its Pearl Club
          guide. Pick a city above, or start with one of these.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 text-left transition-colors hover:border-ink hover:bg-mist"
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
