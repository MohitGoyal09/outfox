
import { eventStatusTone } from "./ask-model";
import type { ToolCallCardView } from "./ask-model";

type PartsHolder = { parts?: unknown };

function toolNameOf(type: string, part: Record<string, unknown>): string {
  return type === "dynamic-tool" ? String(part["toolName"] ?? "tool") : type.replace(/^tool-/, "");
}

export function hasStreamedThisSession(message: PartsHolder): boolean {
  return partsOf(message).some((part) => part["type"] === "data-answer-meta");
}

export function textOf(message: PartsHolder): string {
  return partsOf(message)
    .map((part) => (part["type"] === "text" ? String(part["text"] ?? "") : ""))
    .join("");
}

export function precedingUserTextOf(
  messages: (PartsHolder & { role: string })[],
  index: number,
): string | null {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (candidate.role === "user") return textOf(candidate);
  }
  return null;
}

export type SourceView = { url: string; engine: string; claimText?: string; fetchedAt?: string };

function isSourcesMetaPart(type: unknown): boolean {
  return type === "data-answer-meta" || type === "data-hydrated-citations";
}

export function sourcesOf(messages: PartsHolder[]): SourceView[] {
  const byUrl = new Map<string, SourceView>();
  for (const message of messages) {
    for (const part of partsOf(message)) {
      if (!isSourcesMetaPart(part["type"])) continue;
      const data = part["data"];
      if (!Array.isArray(sources)) continue;
      for (const entry of sources) {
      }
    }
  }
  return [...byUrl.values()];
}

export type ApprovalPartView = {
  toolCallId: string;
  toolName: string;
  approval?: { id: string; approved?: boolean };
  input?: unknown;
};

export function approvalPartsOf(message: PartsHolder): ApprovalPartView[] {
  for (const part of partsOf(message)) {
    if (!isToolPart(type)) continue;
    if (part["state"] !== "approval-requested") continue;
    const approval = part["approval"] as { id: string; approved?: boolean } | undefined;
  }
  return out;
}

function toolCallStatusOf(state: string): ToolCallCardView["status"] {
  if (state === "output-error" || state === "output-denied") return "failed";
}

export type AnswerProvenance = {
  mode: "llm" | "template";
};

export function answerProvenanceOf(messages: PartsHolder[]): AnswerProvenance | null {
  let latest: AnswerProvenance | null = null;
  for (const message of messages) {
    const parts = partsOf(message);
    const ranAnyTool = parts.some((part) => {
    });
  }
  return latest;
}

export function citationSourcesOf(messages: PartsHolder[]): Map<string, SourceView> {
  for (const message of messages) {
    for (const part of partsOf(message)) {
      if (!isSourcesMetaPart(part["type"])) continue;
      const data = part["data"];
      const citationSources = (data as Record<string, unknown>)["citationSources"];
      if (typeof citationSources !== "object" || citationSources === null) continue;
    }
  }
  return byClaimId;
}

export type SourceRowView = {
  claimId: string;
  url: string;
  engine: string;
  text: string;
  fetchedAt: string | null;
};

export type ClaimTextById = Map<
  string,
  { text: string; fetchedAt: string; sourceEngine?: string; taggedClaimId?: unknown }
>;

export function formatFetchedAt(iso: string | null): string {
  if (iso === null) return "date unknown";
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const ENGINE_DOMAIN: Record<string, string> = {
  google: "google.com",
  google_news: "news.google.com",
  google_ads_transparency_center: "adstransparency.google.com",
  youtube: "youtube.com",
  youtube_video: "youtube.com",
  google_trends: "trends.google.com",
};

export function engineDomain(engine: string, url: string): string {
  return ENGINE_DOMAIN[engine] ?? hostnameOf(url);
}

type CitationUnit = { n: string; id: string };

const CITATION_RUN_RE = /(?:\[\d+\]\(claim:[^)\s]+\)[ \t]*,?[ \t]*)+/g;

function unitsOf(run: string): CitationUnit[] {
  const units: CitationUnit[] = [];
  CITATION_UNIT_RE.lastIndex = 0;
  return units;
}

function hostOfClaim(claimId: string, citationSources: Map<string, SourceView>): string | null {
  return source === undefined ? null : engineDomain(source.engine, source.url);
}

export function collapseAdjacentSameHostCitations(
  markdown: string,
  citationSources: Map<string, SourceView>,
): string {
  return markdown.replace(CITATION_RUN_RE, (run) => {
    const units = unitsOf(run);
    if (units.length < 2) return run;

    const segments: string[] = [];
    let i = 0;
    while (i < units.length) {
      const host = hostOfClaim(units[i].id, citationSources);
      while (j < units.length && host !== null && hostOfClaim(units[j].id, citationSources) === host) {
        j += 1;
      }
      if (host !== null && j - i >= 2) {
        const pairs = units
          .slice(i, j)
          .map((unit) => `${unit.n}:${unit.id}`)
          .join(",");
        segments.push(`[${units[i].n}](claimset:${pairs})`);
      } else {
        segments.push(`[${units[i].n}](claim:${units[i].id})`);
        j = i + 1;
      }
    }
    return segments.join(" ");
  });
}

