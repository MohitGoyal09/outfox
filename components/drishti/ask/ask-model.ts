import type { AnswerQuestionResult } from "@/lib/askTypes";
import type { Coverage } from "@/lib/agentTypes";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { TrendsChartResult } from "@/components/drishti/charts";
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

const PAYLOAD_COUNT_FIELDS: { key: string; noun: string }[] = [
  { key: "resultCount", noun: "result" },
  { key: "claimCount", noun: "claim" },
  { key: "brandCount", noun: "brand" },
  { key: "tokens", noun: "token" },
];

function phrasedResultSummary(payload: Record<string, unknown>): string | null {
  return null;
}

export function buildToolCallCards(events: PersistedEvent[]): ToolCallCardView[] {
  const cards: ToolCallCardView[] = [];
  for (const event of events) {
    if (event.kind === "plan" || event.kind === "answer") continue;
    const running = queue?.shift();
  }
  return cards;
}

export function turnWallDurationMs(group: PersistedEvent[]): number | null {
  const last = new Date(group[group.length - 1]!.createdAt).getTime();
  const span = last - first;
}

type PersistedTrendsRow = TrendsChartResult["rows"][number];

type PersistedTrendsGroup = {
  brandId: string;
  chunkKey: string;
  evidenceUrl: string;
  granularity: "point" | "window";
  fetchedAt: string;
  points: Array<[string, string | number | null]>;
};

function isPersistedTrendsGroup(value: unknown): value is PersistedTrendsGroup {
  if (typeof value !== "object" || value === null) return false;
  const g = value as Record<string, unknown>;
  return (
    typeof g.brandId === "string" &&
    typeof g.chunkKey === "string" &&
    typeof g.evidenceUrl === "string" &&
    typeof g.fetchedAt === "string" &&
    (g.granularity === "point" || g.granularity === "window") &&
    Array.isArray(g.points) &&
    g.points.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        typeof p[0] === "string" &&
        (p[1] === null || typeof p[1] === "string" || typeof p[1] === "number"),
    )
  );
}

function rowsFromPersistedGroup(group: PersistedTrendsGroup): PersistedTrendsRow[] {
  return group.points.map(([date, value]) => ({
    id: `${group.brandId}:${group.chunkKey}:${date}`,
    brandId: group.brandId,
    chunkKey: group.chunkKey,
    date,
    ...(value !== null ? { value } : {}),
    evidenceUrl: group.evidenceUrl,
    fetchedAt: group.fetchedAt,
    granularity: group.granularity,
  }));
}

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

export function engineLabel(engine: string): string {
  return ENGINE_LABELS[engine] ?? engine.replaceAll("_", " ");
}

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
