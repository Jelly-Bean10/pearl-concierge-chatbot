import { toSegments, type Segment } from "@/lib/citations";
import type { Dict } from "@/lib/i18n";
import type { PlaceCard as Place } from "@/lib/types";
import type { UIMessage } from "./Chat";
import PlaceCard from "./PlaceCard";
import RequestForm from "./RequestForm";

type Piece = { kind: "text"; text: string } | { kind: "place"; text: string; ref: number };

const fold = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'");

/**
 * Turn "Rogues. [[8]]" into a clickable place name. The marker is dropped; when the words just before it are
 * the place's name, they become the link to its card. A marker the model put somewhere else just disappears.
 */
function toPieces(segments: Segment[], nameOf: (ref: number) => string | undefined): Piece[] {
  const pieces: Piece[] = [];
  for (const seg of segments) {
    if (seg.kind === "text") {
      pieces.push({ kind: "text", text: seg.text });
      continue;
    }
    const name = nameOf(seg.ref);
    const prev = pieces[pieces.length - 1];
    if (!name || prev?.kind !== "text") continue;
    const before = prev.text.trimEnd();
    if (!fold(before).endsWith(fold(name))) continue;
    prev.text = before.slice(0, before.length - name.length);
    pieces.push({ kind: "place", text: before.slice(before.length - name.length), ref: seg.ref });
  }
  return pieces;
}

interface Props {
  t: Dict;
  message: UIMessage;
  isLast: boolean;
  busy: boolean;
  onSuggestion: (text: string) => void;
  onRetry: () => void;
  onRequest: (place: Place) => void;
  onFormLogged: (id: number, what: string) => void;
  onFormCancel: () => void;
}

export default function AssistantMessage({
  t,
  message,
  isLast,
  busy,
  onSuggestion,
  onRetry,
  onRequest,
  onFormLogged,
  onFormCancel,
}: Props) {
  const validRefs = new Set(message.places.map((p) => p.ref));
  const cited = message.citedRefs.map((ref) => message.places[ref - 1]).filter(Boolean);

  function scrollToCard(ref: number) {
    document
      .getElementById(`card-${message.id}-${ref}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Pearl</p>

      {message.status === "pending" && (
        <div className="flex items-center gap-3 text-sm text-muted" role="status" aria-live="polite">
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-ink"
                style={{ animation: `pearl-pulse 1.2s ${i * 0.15}s infinite ease-in-out` }}
              />
            ))}
          </span>
          {message.intent === "recommend" ? t.searching : t.thinking}
        </div>
      )}

      {message.text && (
        <div className="whitespace-pre-wrap text-base leading-[26px] text-ink">
          {toPieces(toSegments(message.text, validRefs), (ref) => message.places[ref - 1]?.name).map((p, i) =>
            p.kind === "text" ? (
              <span key={i}>{p.text}</span>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => scrollToCard(p.ref)}
                className="font-semibold text-ink underline decoration-line decoration-2 underline-offset-[5px] transition-colors hover:decoration-ink"
              >
                {p.text}
              </button>
            ),
          )}
        </div>
      )}

      {cited.length > 0 && (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {cited.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              domId={`card-${message.id}-${place.ref}`}
              t={t}
              onRequest={busy ? undefined : () => onRequest(place)}
            />
          ))}
        </div>
      )}

      {message.form?.status === "open" && (
        <RequestForm t={t} prefill={message.form.prefill} onLogged={onFormLogged} onCancel={onFormCancel} />
      )}
      {message.form?.status === "logged" && (
        <div className="rounded-lg bg-mist px-4 py-3 text-sm leading-5 text-ink" role="status">
          <p className="font-bold">{t.form.doneTitle}</p>
          <p className="mt-1 text-ink-soft">{t.form.doneBody(message.form.what ?? "", message.form.requestId ?? 0)}</p>
        </div>
      )}
      {message.form?.status === "cancelled" && <p className="text-sm text-muted">{t.form.cancelled}</p>}

      {message.status === "error" && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger" role="alert">
          <p>{message.error ? t.errors[message.error] : ""}</p>
          {isLast && (
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="-mb-2 mt-1 min-h-10 font-medium underline underline-offset-2"
            >
              {t.retry}
            </button>
          )}
        </div>
      )}

      {isLast && message.status === "done" && message.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {message.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => onSuggestion(s)}
              className="min-h-11 rounded-full border border-line px-4 py-2 text-[15px] leading-5 text-ink transition-colors hover:border-ink hover:bg-mist disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
