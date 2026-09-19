"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { validateBriefSentences } from "./pipeline/guardrail";
import type { BriefSentence } from "./pipeline/guardrail";
import { callLLM } from "./lib/llmClient";
import type { CallLLMResult } from "./lib/llmClient";
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
};

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

export async function answerFromStoredClaims(
  question: string,
  claims: AskClaimView[],
  llmFn: LLMFn = callLLM,
): Promise<AnswerQuestionResult> {
  let raw: CallLLMResult;
  try {
    raw = await llmFn({
      system: ASK_SYSTEM,
      prompt: buildAskPrompt(question, claims),
      modelAlias: "fast",
      json: true,
    });
  } catch (error) {
    return {
      available: true,
      answer: "",
      citations: [],
      mode: "error",
      error: error instanceof Error ? error.message : "LLM request failed",
    };
  }
  if (raw.ok !== true) {
    return {
      available: true,
      answer: "",
      citations: [],
      mode: "error",
      error: raw.error,
    };
  }
  const parsed = parseAskSentences(raw.text);
  if (parsed === null || parsed.length === 0) {
    return {
      available: true,
      answer: "",
      citations: [],
      mode: "invalid",
      error: "Model output was not valid cited JSON",
    };
  }
  const allowed = new Set(claims.map((c) => c.id));
  const texts: Record<string, string> = {};
  for (const claim of claims) texts[claim.id] = claim.text;
  return {
    available: true,
    answer: checked.valid.map((s) => s.text).join(" "),
    citations: [...new Set(checked.valid.flatMap((s) => s.citedClaimIds))],
    mode: "llm",
  };
}

export const answerQuestion = action({
  args: {
    question: v.string(),
    brandIds: v.array(v.id("brands")),
    runId: v.optional(v.id("runs")),
    latestRequested: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<AnswerQuestionResult> => {
    if (args.brandIds.length > MAX_BRANDS_PER_RUN) {
      throw new ConvexError(
        `Too many brands: ${args.brandIds.length}, limit is ${MAX_BRANDS_PER_RUN}`,
      );
    }
    if (args.question.trim() === "") {
      throw new ConvexError("question must be non empty");
    }
    if (args.latestRequested === true) {
      return {
        available: true,
        needsRefresh: true,
        answer: "",
        citations: [],
        mode: "empty",
        message: REFRESH_ONLY_MESSAGE,
      };
    }
    return await answerFromStoredClaims(args.question, views);
  },
});
