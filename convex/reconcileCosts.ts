"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createGateway } from "@ai-sdk/gateway";

export const DEFAULT_RECONCILE_LIMIT = 25;

export type GatewayCostLookup = (
  generationId: string,
) => Promise<number | undefined>;

export function createGatewayCostLookup(apiKey: string): GatewayCostLookup {
  const gateway = createGateway({ apiKey });
  return async (generationId: string) => {
    const info = await gateway.getGenerationInfo({ id: generationId });
    const total = (info as { totalCost?: unknown } | undefined)?.totalCost;
    return typeof total === "number" && Number.isFinite(total) && total >= 0
      ? total
      : undefined;
  };
}

let lookupFactory: (apiKey: string) => GatewayCostLookup =
  createGatewayCostLookup;

export const reconcileExactCosts = internalAction({
  args: { runId: v.optional(v.id("runs")), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let reconciled = 0;
    return { reconciled, skipped, reason: null };
  },
});
