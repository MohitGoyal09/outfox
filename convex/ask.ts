"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { validateBriefSentences } from "./pipeline/guardrail";
import type { BriefSentence } from "./pipeline/guardrail";
import { callLLM, hasLLMKey } from "./lib/llmClient";
import type { CallLLMResult, CallLLMUsage } from "./lib/llmClient";
import { callLLMTracked, defaultBudgetForTask } from "./lib/modelRouter";
import type { Doc, Id } from "./_generated/dataModel";
import { MAX_BRANDS_PER_RUN, MAX_CONCURRENCY } from "./pipeline/plan";

export type LLMFn = (input: {
  system: string;
  prompt: string;
  modelAlias?: "fast" | "reasoning" | "fallback";
  json?: boolean;
}) => Promise<CallLLMResult>;

export type AskClaimView = {
  id: string;
  brandId: string;
  brandName: string;
  text: string;
  metric?: string;
  value?: string | number;
  sourceEngine: string;
  evidenceUrl: string;
  fetchedAt: string;
};

export type AnswerQuestionResult = {
  available: boolean;
  needsRefresh?: boolean;
  answer: string;
  citations: string[];
  mode: "llm" | "empty" | "error" | "invalid";
  message?: string;
  error?: string;
  usage?: CallLLMUsage[];
};

type LLMOutcome =
  | { ok: true; text: string; usage?: CallLLMUsage }
  | { ok: false; error: string; usage?: CallLLMUsage };

const GATEWAY_MESSAGE = "Ask needs an LLM gateway key";

const ASK_SYSTEM =
  "You answer one brand question using only the stored claims given. " +
  "Reply with JSON holding a sentences array. " +
  "Each entry holds text and citedClaimIds. " +
  "Every sentence must cite at least one claim id from the input. " +
  "Never invent facts, numbers, or sources. " +
  "When the claims cannot answer, say so plainly and cite the closest claim.";

const REFRESH_ONLY_MESSAGE =
  "Latest data was requested, so this question needs a fresh run first. " +
  "Confirm refresh, then ask again once the new run lands.";

function clip(text: string, max: number): string {
}

function stripCodeFences(raw: string): string {
  if (trimmed.startsWith("```")) {
  }
}

function isSentenceRecord(value: unknown): value is BriefSentence {
  if (typeof value !== "object" || value === null) return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec["text"] === "string" &&
    Array.isArray(rec["citedClaimIds"]) &&
    (rec["citedClaimIds"] as unknown[]).every((id) => typeof id === "string")
  );
}

function hasGatewayKey(): boolean {
  return hasLLMKey();
}
