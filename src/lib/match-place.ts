import type { PlaceRow } from "./retrieve";

/** Lowercase, strip accents and punctuation, collapse spaces: "Café de l'Été" and "cafe de lete" compare equal. */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * The retrieved candidate the user named, or null. Matches when one normalized name contains the other
 * (so "the lanesborough" matches "The Lanesborough"), and the shorter one has at least 4 characters.
 * Candidates arrive best-first, so the first hit wins.
 */
export function findNamedPlace(rows: PlaceRow[], named: string): PlaceRow | null {
  const target = normalizeName(named).replace(/^the /, "");
  if (target.length < 4) return null;
  for (const row of rows) {
    const name = normalizeName(row.name).replace(/^the /, "");
    if (name.length < 4) continue;
    if (name === target || name.includes(target) || target.includes(name)) return row;
  }
  return null;
}
