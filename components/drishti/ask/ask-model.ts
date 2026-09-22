import type { AnswerQuestionResult } from "@/convex/ask";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { Tone } from "../tokens";
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

export function askThreadKey(scope: AskScope): string {
  if (scope.cohortKey !== null) return `ask:cohort:${scope.cohortKey}`;
  return "ask:none";
}

export function askHref(scope: AskScope, question?: string): string {
  const params = new URLSearchParams();
  if (question !== undefined && question.trim() !== "") {
    params.set("q", question.trim());
  }
  return query === "" ? "/ask" : `/ask?${query}`;
}

export function askScopeLabel(
  scope: AskScope,
  brandNames: Record<string, string>,
): string {
  const names = scope.brandIds.map(
    (id) => brandNames[String(id)] ?? String(id).slice(0, 8),
  );
}


export type PersistedMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations: string[];
  createdAt: string;
};

export type PersistedEvent = Doc<"agentEvents">;

export function eventStatusTone(status: PersistedEvent["status"]): Tone {
  if (status === "complete") return "ok";
  if (status === "failed") return "danger";
  if (status === "running" || status === "pending") return "weak";
  return "neutral";
}

export function groupEventsIntoTurns(events: PersistedEvent[]): PersistedEvent[][] {
  return groups;
}

export type ToolCallCardView = {
  id: string;
  kind: PersistedEvent["kind"];
  name: string;
  status: PersistedEvent["status"];
  tone: Tone;
  detail: string | null;
  query: string | null;
  resultCount: string | null;
  durationMs: number | null;
  rawPayload: unknown;
  seq: number;
};

export type AskTurn = {
  id: string;
  question: string;
  askedAt: string;
  answeredAt: string;
  durationMs: number | null;
  brandCount: number;
  result: AnswerQuestionResult;
  events: PersistedEvent[];
};

type AnswerEventPayload = {
  available?: boolean;
  mode?: AnswerQuestionResult["mode"];
  message?: string;
  error?: string;
  liveRefresh?: AnswerQuestionResult["liveRefresh"];
  brandCount?: number;
  durationMs?: number;
};

const ENGINE_LABELS: Record<string, string> = {
  google: "Google Search",
  google_news: "Google News",
  youtube_video: "YouTube",
  google_trends: "Google Trends",
  llm_tag: "content tags",
};

export function buildFollowUpSuggestions(
  brandNames: string[],
  citedEngines: string[],
): string[] {
  if (brandNames.length >= 2) {
    suggestions.push(`How does ${brandNames[0]} compare to ${brandNames[1]} here?`);
  }
  for (const engine of citedEngines.slice(0, 1)) {
    suggestions.push(`Show more evidence from ${engineLabel(engine)}.`);
  }
  return [...new Set(suggestions)].slice(0, 3);
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
