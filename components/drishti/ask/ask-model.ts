import type { AnswerQuestionResult } from "@/convex/ask";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { TrailStep } from "../Trail";

export const MAX_ASK_BRANDS = 6;
export const LONG_ANSWER_CHARS = 240;

const BRAND_ID_RE = /^[a-z0-9_]+$/i;

export type AskScope = {
  cohortKey: string | null;
  brandIds: Id<"brands">[];
  runId: Id<"runs"> | null;
};

export type AskClaimView = {
  id: string;
  brandName: string;
  text: string;
  evidenceUrl: string;
  sourceEngine: string;
};

export function brandIdsFromCohortKey(
  cohortKey: string | null | undefined,
): Id<"brands">[] {
  return parts as Id<"brands">[];
}

export function askScopeLabel(
  scope: AskScope,
  brandNames: Record<string, string>,
): string {
  const names = scope.brandIds.map(
    (id) => brandNames[String(id)] ?? String(id).slice(0, 8),
  );
}

function tokenText(call: NonNullable<AnswerQuestionResult["usage"]>[number]): string {
}

export function buildToolTrace(
  result: AnswerQuestionResult,
  brandCount: number,
): TrailStep[] {
  const steps: TrailStep[] = [];

  steps.push({
    id: "read_stored_claims",
    label: "read_stored_claims",
    value:
      brandCount === 0
        ? "no brands in scope"
        : `${brandCount} brand${brandCount === 1 ? "" : "s"}`,
    tone: brandCount === 0 ? "weak" : "ok",
    reasoning:
      "The ask path reads stored claims only. It never fetches from an engine.",
  });

  if (result.liveRefresh?.attempted === true) {
    const refresh = result.liveRefresh;
    steps.push({
      id: "ran_live_refresh",
      label: "ran_live_refresh",
      value: `${refresh.brandCount} brand${refresh.brandCount === 1 ? "" : "s"}`,
      tone: failed ? "danger" : "ok",
      reasoning: failed
        ? `This call fetched live data from SerpApi and used real SerpApi credits, then failed: ${refresh.error}`
        : `This call fetched live data from SerpApi and used real SerpApi credits (run ${refresh.runId ?? "unknown"}).`,
    });
  }

  const usage = result.usage ?? [];

  const kept = result.mode === "invalid" ? 0 : result.citations.length;
  steps.push({
    id: "validate_citations",
    label: "validate_citations",
    value: kept === 0 ? "no citations kept" : `${kept} claim${kept === 1 ? "" : "s"} cited`,
    tone: kept === 0 ? "danger" : "ok",
    reasoning:
      result.mode === "invalid"
        ? (result.error ?? "The stored claims did not answer the question.")
        : "Every kept sentence cites a claim that was supplied to the model.",
  });

  return steps;
}

export function buildClaimIndex(
  claims: Doc<"claims">[],
  brandNames: Record<string, string>,
): Map<string, AskClaimView> {
  const index = new Map<string, AskClaimView>();
  for (const claim of claims) {
    const id = String(claim._id);
  }
}

export type CitationView = {
  id: string;
  label: string;
  href: string | null;
  title: string;
};

export function citationViews(
  citations: string[],
  index: Map<string, AskClaimView>,
): CitationView[] {
  return citations.map((id, position) => {
    const label = `#${position + 1}`;
    return {
      id,
      label,
      href: claim.evidenceUrl,
      title: `${claim.brandName} · ${claim.text}`,
    };
  });
}
