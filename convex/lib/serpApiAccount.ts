"use node";

/**
 * SerpApi Account API client. The free `/account` endpoint returns real plan
 * and credit data and consumes NO search credits. It is the honest source for
 * "searches left", unlike a search response, which carries no credit count.
 *
 * One entry point, `fetchSerpApiAccount`, normalizes field names, never throws,
 * and redacts secrets from errors the same way `serpapiClient` does. A short
 * in-memory cache lets a burst of UI reads share one request; the run bypasses
 * it (`maxAgeMs: 0`) so the before and after snapshots are real, independent
 * readings rather than the same cached value.
 */

export type SerpApiAccountData = {
  accountStatus: string;
  planName: string;
  searchesPerMonth: number;
  thisMonthUsage: number;
  planSearchesLeft: number;
  totalSearchesLeft: number;
  extraCredits: number;
  rateLimitPerHour: number;
};

export type SerpApiAccountResult =
  | { ok: true; data: SerpApiAccountData }
  | { ok: false; error: string };

export type FetchSerpApiAccountOptions = {
  /** Cache lifetime in ms. 0 disables the cache (always fetch). */
  maxAgeMs?: number;
  /** Injectable fetch, for tests. Defaults to the global fetch. */
  fetchFn?: typeof fetch;
};

const ACCOUNT_URL = "https://serpapi.com/account";
const DEFAULT_CACHE_MS = 60_000;

let cache: { at: number; result: SerpApiAccountResult } | null = null;

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
      : "SerpApi account request failed";
  return redactSecrets(raw);
}

function numberOf(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringOf(value: unknown, fallback: string): string {
  return typeof value === "string" && value !== "" ? value : fallback;
}

/**
 * Map the documented Account API JSON onto our camelCase shape. Returns null
 * for an error body, a non-object, or a response without `account_status`, so
 * callers report "not reported" instead of fabricating a zeroed account.
 */
export function normalizeSerpApiAccount(
  raw: unknown,
): SerpApiAccountData | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const error = record["error"];
  if (typeof error === "string" && error.trim() !== "") return null;
  const accountStatus = record["account_status"];
  if (typeof accountStatus !== "string" || accountStatus.trim() === "") {
    return null;
  }
  return {
    accountStatus,
    planName: stringOf(record["plan_name"], "unknown"),
    searchesPerMonth: numberOf(record["searches_per_month"], 0),
    thisMonthUsage: numberOf(record["this_month_usage"], 0),
    planSearchesLeft: numberOf(record["plan_searches_left"], 0),
    totalSearchesLeft: numberOf(record["total_searches_left"], 0),
    extraCredits: numberOf(record["extra_credits"], 0),
    rateLimitPerHour: numberOf(record["account_rate_limit_per_hour"], 0),
  };
}

/**
 * Read the Account API. Missing key fails fast with no network call. Every
 * other outcome (HTTP error, malformed body, thrown fetch) becomes
 * `{ ok: false }`; this function never throws.
 */
export async function fetchSerpApiAccount(
  options: FetchSerpApiAccountOptions = {},
): Promise<SerpApiAccountResult> {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_CACHE_MS;
  const now = Date.now();
  if (maxAgeMs > 0 && cache !== null && now - cache.at < maxAgeMs) {
    return cache.result;
  }
  // Primary SERPAPI_API_KEY; SERP_API_KEY accepted as fallback alias,
  // matching serpapiClient so a key stored under either name is picked up.
  const apiKey = process.env.SERPAPI_API_KEY ?? process.env.SERP_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return { ok: false, error: "SERPAPI_API_KEY/SERP_API_KEY is not set" };
  }
  const fetchFn = options.fetchFn ?? fetch;
  try {
    const response = await fetchFn(
      `${ACCOUNT_URL}?api_key=${encodeURIComponent(apiKey)}`,
    );
    if (!response.ok) {
      return {
        ok: false,
        error: redactSecrets(`SerpApi account HTTP ${response.status}`),
      };
    }
    const body: unknown = await response.json();
    const data = normalizeSerpApiAccount(body);
    if (data === null) {
      return { ok: false, error: "SerpApi account response was not recognized" };
    }
    const result: SerpApiAccountResult = { ok: true, data };
    if (maxAgeMs > 0) cache = { at: Date.now(), result };
    return result;
  } catch (error) {
    return { ok: false, error: errorMessageOf(error) };
  }
}
