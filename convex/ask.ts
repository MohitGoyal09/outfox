"use node";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
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

async function fetchClaimViews(
  ctx: ActionCtx,
  args: { brandIds: Id<"brands">[]; runId?: Id<"runs"> },
): Promise<AskClaimView[]> {
}

export const answerQuestion = action({
  args: {
    question: v.string(),
    brandIds: v.array(v.id("brands")),
    runId: v.optional(v.id("runs")),
    latestRequested: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<AnswerQuestionResult> => {
    await requireUserId(ctx);
    if (args.brandIds.length > MAX_BRANDS_PER_RUN) {
      throw new ConvexError(
        `Too many brands: ${args.brandIds.length}, limit is ${MAX_BRANDS_PER_RUN}`,
      );
    }
    const question = clip(args.question, 2000);
    if (question.trim() === "") {
      throw new ConvexError("question must be non empty");
    }

    let firstResult: AnswerQuestionResult | undefined;
    let needsLiveRun = args.latestRequested === true;

    let liveRefresh: NonNullable<AnswerQuestionResult["liveRefresh"]>;
    try {
      const runResult = await ctx.runAction(api.pipeline.runComparison.runComparison, {
        brandIds: args.brandIds,
        mode: "live",
        refreshAuthorized: true,
      });
      liveRefresh = {
        attempted: true,
        runId: String(runResult.runId),
        brandCount: args.brandIds.length,
      };
      const freshViews = await fetchClaimViews(ctx, readArgs);
    } catch (error) {
      return { ...fallback, liveRefresh };
    }
  },
});
