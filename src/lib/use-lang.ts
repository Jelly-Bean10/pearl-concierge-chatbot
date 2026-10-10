"use client";

import { useSyncExternalStore } from "react";
import { parseLang, type Lang } from "./i18n";

// UI language: in-memory override, then localStorage, then the browser language, else English.
const KEY = "pearl-lang";
let override: Lang | null = null;
const listeners = new Set<() => void>();

function read(): Lang {
  if (override) return override;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return parseLang(saved);
  } catch {}
  return parseLang(navigator.language.slice(0, 2));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLang(): [Lang, (lang: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, read, () => "en" as Lang);
  const setLang = (next: Lang) => {
    override = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    listeners.forEach((l) => l());
  };
  return [lang, setLang];
}
