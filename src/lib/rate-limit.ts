import "server-only";

// Best-effort, per server instance. Enough to stop a stuck client or casual abuse of a demo link;
// the real cost ceiling is the monthly budget set on the OpenAI project (docs/10-DEPLOYMENT.md).
const WINDOW_MS = 10 * 60_000;
const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Returns true if the request is allowed. Each bucket ("chat", "request") has its own counter and limit. */
export function allowRequest(ip: string, bucket = "chat", max = 30): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear(); // crude memory cap
  return true;
}
