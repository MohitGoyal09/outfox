"use node";

import { getJson } from "serpapi";

export type SerpApiSuccess = {
  ok: true;
  data: any;
  latencyMs: number;
  credits?: number;
};

export type SerpApiFailure = {
  ok: false;
  error: string;
  latencyMs: number;
};

export type SerpApiResult = SerpApiSuccess | SerpApiFailure;

export type EngineStatus = "ok" | "failed";

function readCredits(data: unknown): number | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const record = data as Record<string, unknown>;
  const meta = record["search_metadata"];
  if (typeof meta !== "object" || meta === null) return undefined;
  const credits = (meta as Record<string, unknown>)["total_credits_used"];
  return typeof credits === "number" ? credits : undefined;
}

function redactSecrets(message: string): string {
  return message
    .replace(/api_key[^=&"'\s]*=[^&"'\s]*/gi, "api_key=[REDACTED]")
    .replace(/("api_key"\s*:\s*")[^"]*(")/gi, "$1[REDACTED]$2")
    .replace(/([?&]key=)[^&"'\s]+/gi, "$1[REDACTED]");
}

function errorMessageOf(error: unknown): string {
  const raw =
    error instanceof Error && error.message !== ""
      ? error.message
      : "SerpApi request failed";
  return redactSecrets(raw);
}

/**
 * Map a client result to the snapshot status for an attempted engine call.
 * The unavailable status is decided by the caller before any network call.
 */
export function toEngineStatus(result: SerpApiResult): EngineStatus {
  return result.ok ? "ok" : "failed";
}

/**
 * Single server side SerpApi entry point.
 * Injects the server key, measures latency, reads the credit count when
 * present, and normalizes every outcome so callers never see a thrown
 * network or API error. Missing key fails fast with no network call.
 */
export async function serpapiFetch(
  params: Record<string, any>,
): Promise<SerpApiResult> {
  const started = Date.now();
  try {
    // Primary SERPAPI_API_KEY; SERP_API_KEY accepted as fallback alias
    // so a key stored under either name is picked up server side.
    const apiKey = process.env.SERPAPI_API_KEY ?? process.env.SERP_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return {
        ok: false,
        error: "SERPAPI_API_KEY/SERP_API_KEY is not set",
        latencyMs: Date.now() - started,
      };
    }
    const data = await getJson({ ...params, api_key: apiKey });
    return {
      ok: true,
      data,
      latencyMs: Date.now() - started,
      credits: readCredits(data),
    };
  } catch (error) {
    return {
      ok: false,
      error: errorMessageOf(error),
      latencyMs: Date.now() - started,
    };
  }
}
