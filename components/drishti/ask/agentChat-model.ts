
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

export type SourceView = { url: string; engine: string };

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
};

function toolCallStatusOf(state: string): ToolCallCardView["status"] {
  if (state === "output-error" || state === "output-denied") return "failed";
}

function resultSummaryOfOutput(output: unknown): string | null {
  if (typeof output !== "object" || output === null) return null;
  const record = output as Record<string, unknown>;
  for (const key of ["claims", "matches", "rows", "points", "citations"]) {
    const list = record[key];
    const base = list.length === 0 ? `no ${noun}s` : `${list.length} ${noun}${list.length === 1 ? "" : "s"}`;
    const coverage = record["coverage"];
    const engineCount =
      typeof coverage === "object" && coverage !== null ? Object.keys(coverage).length : 0;
  }
  return null;
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
  return byClaimId;
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

export type UntrackedBrandMention = { name: string };

export function untrackedBrandMentionOf(message: PartsHolder): UntrackedBrandMention | null {
  for (const part of partsOf(message)) {
    if (part["type"] !== "data-answer-meta") continue;
    const data = part["data"];
    const untrackedBrand = (data as Record<string, unknown>)["untrackedBrand"];
    if (typeof untrackedBrand !== "object" || untrackedBrand === null) continue;
  }
  return null;
}
