
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

export function toolCallCardsOf(message: PartsHolder): ToolCallCardView[] {
  return out;
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
