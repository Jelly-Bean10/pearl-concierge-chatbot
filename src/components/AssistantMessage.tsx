import { toSegments } from "@/lib/citations";
import type { Dict } from "@/lib/i18n";
import type { PlaceCard as Place } from "@/lib/types";
import type { UIMessage } from "./Chat";
import PlaceCard from "./PlaceCard";
import RequestForm from "./RequestForm";

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
          {toSegments(message.text, validRefs).map((s, i) =>
            s.kind === "text" ? (
              <span key={i}>{s.text}</span>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => scrollToCard(s.ref)}
                className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 align-[2px] font-mono text-[10px] text-paper hover:bg-ink-soft"
                aria-label={`Show card ${s.ref}: ${message.places[s.ref - 1]?.name ?? ""}`}
              >
                {s.ref}
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
        <div className="rounded-lg border-l-4 border-ink bg-mist px-4 py-3 text-sm leading-5 text-ink" role="status">
          <p className="font-bold">{t.form.doneTitle}</p>
          <p className="mt-1 text-ink-soft">{t.form.doneBody(message.form.what ?? "", message.form.requestId ?? 0)}</p>
        </div>
      )}
      {message.form?.status === "cancelled" && <p className="text-sm text-muted">{t.form.cancelled}</p>}

      {message.status === "error" && (
        <div className="rounded-lg border-l-4 border-danger bg-danger-bg px-4 py-3 text-sm text-danger" role="alert">
          <p>{message.error ? t.errors[message.error] : ""}</p>
          {isLast && (
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="mt-1 font-medium underline underline-offset-2"
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
              className="h-9 rounded-full border border-line px-3.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-mist disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
