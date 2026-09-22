"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createGateway } from "@ai-sdk/gateway";

export const DEFAULT_RECONCILE_LIMIT = 25;

export type CostBasis = "upstream_inference" | "total";

export type GatewayGenerationCost = {
  totalCost?: number;
  upstreamInferenceCost?: number;
};

export type GatewayCostLookup = (
  generationId: string,
) => Promise<GatewayGenerationCost | undefined>;

export type ResolvedReconciledCost = {
  costUsd: number;
  costBasis: CostBasis;
};

export function resolveReconciledCost(
  info: GatewayGenerationCost | undefined,
): ResolvedReconciledCost | undefined {
  const upstream = info?.upstreamInferenceCost;
  const total = info?.totalCost;
}

export function createGatewayCostLookup(apiKey: string): GatewayCostLookup {
  const gateway = createGateway({ apiKey });
}

let lookupFactory: (apiKey: string) => GatewayCostLookup =
  createGatewayCostLookup;

export const reconcileExactCosts = internalAction({
  args: { runId: v.optional(v.id("runs")), limit: v.optional(v.number()) },
  returns: v.union(
    v.object({
      reconciled: v.number(),
      skipped: v.number(),
      reason: v.string(),
    }),
    v.object({
      reconciled: v.number(),
      skipped: v.number(),
      reason: v.null(),
      skippedReasons: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    let reconciled = 0;
    const skippedReasons: string[] = [];
  },
});
