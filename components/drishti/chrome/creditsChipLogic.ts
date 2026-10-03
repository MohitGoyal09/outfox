
export const SERPAPI_PLAN_SEARCH_LIMIT = 250;

export type LatestCredits = {
  runId: string;
  requestedAt: string;
  searchesLeftAfter: number | null;
} | null;

export type LiveCredits =
  | { ok: true; data: { totalSearchesLeft: number; searchesPerMonth: number } }
  | { ok: false; error: string }
  | null;

export type CreditsChipTone = "neutral" | "danger";

export type CreditsMeter = { left: number; total: number; fill: "fg" | "warn" | "danger" };

export type CreditsChipView = {
  text: string;
  tone: CreditsChipTone;
  meter: CreditsMeter | null;
};

export function creditsMeterFill(left: number, total: number): CreditsMeter["fill"] {
  if (left <= 0) return "danger";
  return left / total < 0.2 ? "warn" : "fg";
}

export function creditsChipView(live: LiveCredits, fallback: LatestCredits | undefined): CreditsChipView {
  if (live !== null && live.ok) {
    const left = live.data.totalSearchesLeft;
    const total = live.data.searchesPerMonth;
    return {
      text: `${left} of ${total} credits left`,
      tone: left <= 0 ? "danger" : "neutral",
      meter: total > 0 ? { left, total, fill: creditsMeterFill(left, total) } : null,
    };
  }
  if (fallback === undefined) {
    return { text: "Checking credits…", tone: "neutral", meter: null };
  }
  if (fallback === null) {
    return { text: "No checks yet", tone: "neutral", meter: null };
  }
  if (fallback.searchesLeftAfter === null) {
    return { text: "Credits not recorded", tone: "neutral", meter: null };
  }
  const left = fallback.searchesLeftAfter;
  return {
    text: `${left} left as of last check`,
    tone: left <= 0 ? "danger" : "neutral",
    meter: null, // dated snapshot has no measured total; never invent one
  };
}
