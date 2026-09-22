
import { eventStatusTone } from "./ask-model";
import type { ToolCallCardView } from "./ask-model";

type PartsHolder = { parts?: unknown };

function toolNameOf(type: string, part: Record<string, unknown>): string {
  return type === "dynamic-tool" ? String(part["toolName"] ?? "tool") : type.replace(/^tool-/, "");
}

export function textOf(message: PartsHolder): string {
  return partsOf(message)
    .map((part) => (part["type"] === "text" ? String(part["text"] ?? "") : ""))
    .join("");
}

export type SourceView = { url: string; engine: string };

export function sourcesOf(messages: PartsHolder[]): SourceView[] {
  const byUrl = new Map<string, SourceView>();
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
    for (const part of partsOf(message)) {
      if (part["type"] !== "data-answer-meta") continue;
      const data = part["data"];
      const record = data as Record<string, unknown>;
      latest = { mode: record["mode"] === "template" ? "template" : "llm" };
    }
  }
  return latest;
}

export function citationSourcesOf(messages: PartsHolder[]): Map<string, SourceView> {
  for (const message of messages) {
    for (const part of partsOf(message)) {
      if (part["type"] !== "data-answer-meta") continue;
      const data = part["data"];
      const citationSources = (data as Record<string, unknown>)["citationSources"];
      if (typeof citationSources !== "object" || citationSources === null) continue;
      for (const [claimId, source] of Object.entries(citationSources as Record<string, unknown>)) {
      }
    }
  }
  return byClaimId;
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
