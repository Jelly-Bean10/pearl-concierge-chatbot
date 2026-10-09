import "server-only";
import OpenAI from "openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
// Must match EMBEDDING_MODEL in scraper/load.py and vector(1536) in the migration.
export const EMBEDDING_MODEL = "text-embedding-3-small";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

// Created lazily so `next build` works without env vars present.
let openaiClient: OpenAI | null = null;
let supabaseClient: SupabaseClient | null = null;

export function getOpenAI(): OpenAI {
  openaiClient ??= new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
    timeout: 20_000, // hard ceiling per request; calls also pass shorter AbortSignals
    maxRetries: 1,
  });
  return openaiClient;
}

// Publishable key is enough: the app only calls the read-only match_places() function. Server only.
export function getSupabase(): SupabaseClient {
  supabaseClient ??= createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseClient;
}
