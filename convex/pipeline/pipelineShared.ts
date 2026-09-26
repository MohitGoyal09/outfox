import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { estimateCostUsd } from "../lib/modelRouter";
import type { CallLLMUsage } from "../lib/llmClient";

export type MinimalCtx = {
  runQuery: (ref: never, args: Record<string, unknown>) => Promise<unknown>;
  runMutation: (ref: never, args: Record<string, unknown>) => Promise<unknown>;
  scheduler?: {
    runAfter: (delayMs: number, ref: never, args: Record<string, unknown>) => Promise<unknown>;
  };
};

export type AgentEventKind = "plan" | "step" | "tool_call" | "answer" | "warning" | "error";
export type AgentEventStatus = "pending" | "running" | "complete" | "failed" | "skipped";

export type UsageTotals = { requests: number; tokens: number; costUsd: number };

export const ZERO_USAGE_TOTALS: UsageTotals = { requests: 0, tokens: 0, costUsd: 0 };

function usageTokens(usage: CallLLMUsage): number {
  return usage.totalTokens ?? (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0);
}

export function addUsageTotals(totals: UsageTotals, usage: CallLLMUsage): UsageTotals {
  return {
    requests: totals.requests + 1,
    tokens: totals.tokens + usageTokens(usage),
    costUsd: totals.costUsd + (costForUsage(usage) ?? 0),
  };
}

export async function persistLlmUsage(
  ctx: MinimalCtx,
  args: { runId: Id<"runs">; threadKey: string; task: "tag" | "brief"; usage: CallLLMUsage },
): Promise<boolean> {
  const costUsd = costForUsage(args.usage);
  try {
    await ctx.runMutation(internal.llmUsage.recordUsage as never, {
      runId: args.runId,
      threadKey: args.threadKey,
      alias: args.usage.alias,
      provider: args.usage.provider,
      model: args.usage.model,
      task: args.task,
      ok: true,
      latencyMs: args.usage.latencyMs,
      ...(args.usage.promptTokens !== undefined ? { promptTokens: args.usage.promptTokens } : {}),
      ...(args.usage.completionTokens !== undefined
        ? { completionTokens: args.usage.completionTokens }
        : {}),
      ...(args.usage.totalTokens !== undefined ? { totalTokens: args.usage.totalTokens } : {}),
      ...(costUsd !== undefined ? { estimatedCostUsd: costUsd } : {}),
    } as Record<string, unknown>);
    return true;
  } catch {
    return false;
  }
}

export type RunTerminalStatus = "complete" | "partial" | "failed";

export async function scheduleBrandInsight(
  ctx: MinimalCtx,
  args: { brandId: Id<"brands">; ownerId: Id<"users">; threadKey: string; runId?: Id<"runs"> },
): Promise<void> {
  if (ctx.scheduler === undefined) return;
  try {
    await ctx.scheduler.runAfter(0, internal.pipeline.brandInsights.generateBrandInsightInternal as never, {
      brandId: args.brandId,
      ownerId: args.ownerId,
    });
  } catch (error) {
    await appendAgentEvent(ctx, {
      threadKey: args.threadKey,
      runId: args.runId,
      kind: "warning",
      name: "schedule_brand_insight",
      status: "failed",
      detail: error instanceof Error ? error.message.slice(0, 300) : "failed to schedule brand insight",
    });
  }
}
