// Citation markers look like [[3]]. Shared by the server (to report cited refs) and the client (to render).

const MARKER = /\[\[(\d{1,2})\]\]/g;
const PARTIAL_MARKER_AT_END = /\[(\[\d{0,2}\]?)?$/; // "[", "[[", "[[1", "[[12]" while streaming

export type Segment = { kind: "text"; text: string } | { kind: "ref"; ref: number };

/** Refs in order of first appearance, keeping only 1..maxRef. */
export function citedRefs(text: string, maxRef: number): number[] {
  const refs: number[] = [];
  for (const m of text.matchAll(MARKER)) {
    const ref = Number(m[1]);
    if (ref >= 1 && ref <= maxRef && !refs.includes(ref)) refs.push(ref);
  }
  return refs;
}

/** Split text into plain text and ref segments. Unknown refs are dropped; a half-streamed marker is hidden. */
export function toSegments(text: string, validRefs: Set<number>): Segment[] {
  const clean = text.replace(PARTIAL_MARKER_AT_END, "");
  const segments: Segment[] = [];
  let last = 0;
  for (const m of clean.matchAll(MARKER)) {
    const index = m.index ?? 0;
    if (index > last) segments.push({ kind: "text", text: clean.slice(last, index) });
    const ref = Number(m[1]);
    if (validRefs.has(ref)) segments.push({ kind: "ref", ref });
    last = index + m[0].length;
  }
  if (last < clean.length) segments.push({ kind: "text", text: clean.slice(last) });
  return segments;
}

/** Text sent back to the API as conversation history: markers removed (the place name precedes each one). */
export function stripMarkers(text: string): string {
  return text
    .replace(MARKER, "")
    .replace(/ +([.,;:!?])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
}
