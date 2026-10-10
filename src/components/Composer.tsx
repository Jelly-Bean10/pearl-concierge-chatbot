"use client";

import { useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/validate";

export default function Composer({ t, busy, onSend }: { t: Dict; busy: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = !busy && text.trim().length > 0;

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 4 * 24 + 20)}px`; // up to 4 lines
  }

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText("");
    requestAnimationFrame(resize);
  }

  return (
    <div className="border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
      <form
        className="mx-auto flex w-full max-w-[720px] flex-col gap-1.5 px-4 pb-3 pt-3 sm:px-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-paper py-1.5 ps-4 pe-1.5 focus-within:border-ink">
          <label htmlFor="message" className="sr-only">
            {t.messageLabel}
          </label>
          <textarea
            id="message"
            ref={ref}
            rows={1}
            value={text}
            maxLength={MAX_USER_MESSAGE_CHARS}
            placeholder={t.placeholder}
            onChange={(e) => {
              setText(e.target.value);
              resize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-[116px] flex-1 resize-none bg-transparent py-2 text-base leading-6 text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t.send}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          <span>{t.footer}</span>
          {text.length > MAX_USER_MESSAGE_CHARS - 100 && (
            <span>
              {text.length}/{MAX_USER_MESSAGE_CHARS}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
