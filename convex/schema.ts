import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const funnelStage = v.union(
  v.literal("unaware"),
  v.literal("problem_aware"),
  v.literal("solution_aware"),
  v.literal("product_aware"),
  v.literal("most_aware"),
  v.literal("not_applicable"),
);

const snapshotStatus = v.union(
  v.literal("ok"),
  v.literal("failed"),
  v.literal("unavailable"),
);

const planStep = v.object({
  id: v.string(),
  capability,
  brandIds: v.optional(v.array(v.string())),
  dimensions: v.optional(v.array(v.string())),
});

const agentPlan = v.object({
  goal: v.string(),
  steps: v.array(planStep),
  requiresRefresh: v.boolean(),
});
