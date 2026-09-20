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

export default defineSchema({
  runs: defineTable({
    cohortKey: v.string(),
    brandIds: v.array(v.id("brands")),
    mode: runMode,
    status: runStatus,
    requestedAt: v.string(),
    completedAt: v.optional(v.string()),
    requestCount: v.number(),
    creditCount: v.optional(v.number()),
    creditsReported: v.optional(v.boolean()),
    searchesLeftBefore: v.optional(v.number()),
    searchesLeftAfter: v.optional(v.number()),
    llmRequestCount: v.optional(v.number()),
    llmTokenCount: v.optional(v.number()),
    llmCostUsd: v.optional(v.number()),
    plan: v.optional(agentPlan),
    currentStep: v.optional(v.string()),
    stepStates: v.optional(v.array(stepState)),
    errorMessage: v.optional(v.string()),
  })
    .index("by_cohort", ["cohortKey"])
    .index("by_status", ["status"]),

  brands: defineTable({
    name: v.string(),
    domain: v.string(),
    vertical: v.string(),
    aliases: v.array(v.string()),
    profileStatus: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("needs_confirmation"),
    ),
    adsTransparencyAdvertiserId: v.optional(v.string()),
    createdAt: v.string(),
    lastRefreshedAt: v.optional(v.string()),
  }).index("by_name", ["name"]),

  snapshots: defineTable({
    runId: v.id("runs"),
    brandId: v.id("brands"),
    engine: sourceEngine,
    queryParams: v.any(),
    region: v.string(),
    fetchedAt: v.string(),
    period: v.optional(v.string()),
    rawResponse: v.optional(v.any()),
    rawResponseHash: v.optional(v.string()),
    claimIds: v.array(v.id("claims")),
    status: snapshotStatus,
    errorMessage: v.optional(v.string()),
  })
    .index("by_run", ["runId"])
    .index("by_brand", ["brandId"])
    .index("by_brand_and_engine", ["brandId", "engine"]),

  claims: defineTable({
    text: v.string(),
    metric: v.optional(v.string()),
    value: v.optional(v.union(v.string(), v.number())),
    unit: v.optional(v.string()),
    period: v.optional(v.string()),
    sourceEngine,
    sourceQuery: v.string(),
    evidenceUrl: v.string(),
    fetchedAt: v.string(),
    runId: v.id("runs"),
    snapshotId: v.id("snapshots"),
    brandId: v.id("brands"),
    hookType: v.optional(hookType),
    funnelStage: v.optional(funnelStage),
    theme: v.optional(v.string()),
    valueProp: v.optional(v.string()),
    cta: v.optional(v.string()),
    confidence: v.optional(confidence),
    taggedClaimId: v.optional(v.id("claims")),
  })
    .index("by_run", ["runId"])
    .index("by_run_and_brand", ["runId", "brandId"])
    .index("by_brand", ["brandId"])
    .index("by_snapshot", ["snapshotId"])
    .index("by_brand_and_metric", ["brandId", "metric"]),

  briefs: defineTable({
    runId: v.id("runs"),
    cohortKey: v.string(),
    brandIds: v.array(v.id("brands")),
    generatedAt: v.string(),
    briefText: v.string(),
    claimIds: v.array(v.id("claims")),
    mode: v.union(v.literal("llm"), v.literal("template")),
  })
    .index("by_run", ["runId"])
    .index("by_cohort_and_generatedAt", ["cohortKey", "generatedAt"])
    .index("by_generatedAt", ["generatedAt"]),

  messages: defineTable({
    threadKey: v.string(),
    runId: v.optional(v.id("runs")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    citations: v.array(v.string()),
    createdAt: v.string(),
  }).index("by_thread_and_createdAt", ["threadKey", "createdAt"]),

  llmUsage: defineTable({
    runId: v.optional(v.id("runs")),
    threadKey: v.optional(v.string()),
    eventId: v.optional(v.id("agentEvents")),
    alias: v.union(v.literal("fast"), v.literal("reasoning"), v.literal("fallback")),
    provider: v.string(),
    model: v.string(),
    task: v.string(),
    ok: v.boolean(),
    latencyMs: v.number(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    totalTokens: v.optional(v.number()),
    costUsd: v.optional(v.number()),
    costSource: v.optional(
      v.union(
        v.literal("provider"),
        v.literal("estimated"),
        v.literal("unknown"),
      ),
    ),
    gatewayGenerationId: v.optional(v.string()),
    estimatedCostUsd: v.optional(v.number()),
    createdAt: v.string(),
  })
    .index("by_run", ["runId"])
    .index("by_thread_and_createdAt", ["threadKey", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  agentEvents: defineTable({
    threadKey: v.string(),
    runId: v.optional(v.id("runs")),
    kind: v.union(
      v.literal("plan"),
      v.literal("step"),
      v.literal("tool_call"),
      v.literal("answer"),
      v.literal("warning"),
      v.literal("error"),
    ),
    name: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    detail: v.optional(v.string()),
    payload: v.optional(v.any()),
    seq: v.number(),
    createdAt: v.string(),
  })
    .index("by_thread_and_seq", ["threadKey", "seq"])
    .index("by_run", ["runId"]),
});
