"use node";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { validateBriefSentences } from "./pipeline/guardrail";
import type { BriefSentence } from "./pipeline/guardrail";
import { callLLM, hasLLMKey } from "./lib/llmClient";
import type { CallLLMResult, CallLLMUsage } from "./lib/llmClient";
import { callLLMTracked, defaultBudgetForTask } from "./lib/modelRouter";
import type { Doc, Id } from "./_generated/dataModel";
import { MAX_BRANDS_PER_RUN, MAX_CONCURRENCY } from "./pipeline/plan";
import { requireUserId } from "./lib/auth";

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
  answer: string;
  citations: string[];
  mode: "llm" | "empty" | "error" | "invalid";
  message?: string;
  error?: string;
  usage?: CallLLMUsage[];
  liveRefresh?: { attempted: true; runId?: string; brandCount: number; error?: string };
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

const EMPTY_MESSAGE = "No stored claims cover these brands yet.";

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

type EventKind = "step" | "tool_call" | "warning" | "error" | "answer";
type EventStatus = "pending" | "running" | "complete" | "failed" | "skipped";
type EventInput = {
  kind: EventKind;
  name: string;
  status: EventStatus;
  detail?: string;
  payload?: unknown;
};

async function safeTurn(
  ctx: Pick<ActionCtx, "runMutation">,
  ownerId: Id<"users">,
  threadKey: string,
  runId: Id<"runs"> | undefined,
  role: "user" | "assistant",
  text: string,
  citations: string[],
): Promise<void> {
  try {
    await ctx.runMutation(internal.messages.appendTurn, {
      ownerId,
      threadKey,
      role,
      text,
      citations,
      ...(runId !== undefined ? { runId } : {}),
    });
  } catch {
    return;
  }
}

function validateCitationsEvent(result: AnswerQuestionResult): EventInput {
  const kept = result.mode === "llm" ? result.citations.length : 0;
  return {
    kind: "step",
    name: "validate_citations",
    status: result.mode === "invalid" ? "failed" : "complete",
    detail:
      result.mode === "invalid"
        ? clip(result.error ?? "The stored claims did not answer the question.", 300)
        : kept === 0
          ? "no citations kept"
          : `${kept} claim${kept === 1 ? "" : "s"} cited`,
    payload: { resultCount: kept },
  };
}

function displayAnswerText(result: AnswerQuestionResult): string {
  if (result.mode === "empty") return result.message ?? result.answer ?? EMPTY_MESSAGE;
  if (result.mode === "invalid") {
    return result.error ?? "The stored claims did not answer this question.";
  }
  return result.answer;
}

async function fetchClaimViews(
  ctx: ActionCtx,
  args: { brandIds: Id<"brands">[]; runId?: Id<"runs"> },
): Promise<AskClaimView[]> {
}
