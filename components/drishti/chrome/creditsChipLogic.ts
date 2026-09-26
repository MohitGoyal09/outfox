
export const SERPAPI_PLAN_SEARCH_LIMIT = 250;

export type LatestCredits = {
  runId: string;
  requestedAt: string;
  searchesLeftAfter: number | null;
} | null;

export type CreditsChipTone = "neutral" | "danger";

export type CreditsChipView = {
  text: string;
  tone: CreditsChipTone;
};

export function creditsChipView(credits: LatestCredits | undefined): CreditsChipView {
  if (credits === undefined) {
    return { text: "Checking credits…", tone: "neutral" };
  }
  if (credits === null) {
    return { text: "No checks yet", tone: "neutral" };
  }
  if (credits.searchesLeftAfter === null) {
    return { text: "Credits not recorded", tone: "neutral" };
  }
  const left = credits.searchesLeftAfter;
  return {
    text: `${left} of ${SERPAPI_PLAN_SEARCH_LIMIT} credits left`,
    tone: left <= 0 ? "danger" : "neutral",
  };
}
