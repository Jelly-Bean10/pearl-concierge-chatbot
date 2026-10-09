import type { StreamEvent } from "./types";

/** Yield one parsed StreamEvent per NDJSON line of a fetch Response body. */
export async function* readEvents(res: Response): AsyncGenerator<StreamEvent> {
  if (!res.body) return;
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as StreamEvent;
    }
  }
  if (buffer.trim()) yield JSON.parse(buffer) as StreamEvent;
}
