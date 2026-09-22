import type { AnswerQuestionResult } from "@/convex/ask";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { TrailStep } from "../Trail";
import type { AskExchange } from "./ask-store";
import {
  findGoogleNewsRawItem,
  findYoutubeRawVideo,
  readGoogleNewsRawItem,
  readYoutubeRawVideo,
  youtubeVideoIdOf,
} from "../brands/brand-model";
import { displayClaimText } from "../brands/format";

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
  sourceQuery: string;
  snapshotId: string;
};

export type AskTagView = {
  hookType: string;
  funnelStage: string;
  theme?: string;
  valueProp?: string;
  cta?: string;
  confidence?: string;
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

export function buildTagIndex(claims: Doc<"claims">[]): Map<string, AskTagView> {
  for (const claim of claims) {
    if (claim.sourceEngine !== "llm_tag") continue;
    if (claim.taggedClaimId === undefined) continue;
    if (claim.hookType === undefined || claim.hookType === "not_applicable") continue;
    index.set(String(claim.taggedClaimId), {
      hookType: claim.hookType,
      funnelStage: claim.funnelStage ?? "not_applicable",
      theme: claim.theme,
      valueProp: claim.valueProp,
      cta: claim.cta,
      confidence: claim.confidence,
    });
  }
}

export function citedSnapshotIds(
  exchanges: AskExchange[],
  claimIndex: Map<string, AskClaimView>,
): Id<"snapshots">[] {
  const ids = new Set<string>();
  for (const exchange of exchanges) {
    for (const citationId of exchange.result.citations) {
      const claim = claimIndex.get(citationId);
      if (claim === undefined) continue;
      if (claim.sourceEngine !== "youtube_video" && claim.sourceEngine !== "google_news") continue;
      ids.add(claim.snapshotId);
    }
  }
  return [...ids] as Id<"snapshots">[];
}

export type CitationCardView = {
  id: string;
  label: string;
  href: string | null;
  brandName: string;
  sourceEngine: string;
  displayText: string;
  thumbnailUrl: string | null;
  tag: AskTagView | null;
};

export function citationViews(
  citations: string[],
  claimIndex: Map<string, AskClaimView>,
  snapshotIndex: Map<string, Doc<"snapshots">>,
  tagIndex: Map<string, AskTagView>,
): CitationCardView[] {
  return citations.map((id, position) => {
    const label = `#${position + 1}`;
  });
}
