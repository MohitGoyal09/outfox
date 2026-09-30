
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

export type CreditsChipView = {
  text: string;
  tone: CreditsChipTone;
};

export function creditsChipView(live: LiveCredits, fallback: LatestCredits | undefined): CreditsChipView {
  if (live !== null && live.ok) {
    const left = live.data.totalSearchesLeft;
    return {
      text: `${left} of ${live.data.searchesPerMonth} credits left`,
      tone: left <= 0 ? "danger" : "neutral",
    };
  }
  if (fallback === undefined) {
    return { text: "Checking credits…", tone: "neutral" };
  }
  if (fallback === null) {
    return { text: "No checks yet", tone: "neutral" };
  }
  if (fallback.searchesLeftAfter === null) {
    return { text: "Credits not recorded", tone: "neutral" };
  }
  const left = fallback.searchesLeftAfter;
  return {
    text: `${left} left as of last check`,
    tone: left <= 0 ? "danger" : "neutral",
  };
}
