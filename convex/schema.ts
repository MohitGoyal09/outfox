import { authTables } from "@convex-dev/auth/server";
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

const sourceEngine = v.union(
  v.literal("google"),
  v.literal("google_ads_transparency_center"),
  v.literal("youtube"),
  v.literal("youtube_video"),
  v.literal("google_trends"),
  v.literal("google_news"),
  v.literal("llm_tag"),
);

const snapshotStatus = v.union(
  v.literal("ok"),
  v.literal("failed"),
  v.literal("unavailable"),
);

const enrichmentStatus = v.union(v.literal("hydrating"), v.literal("ready"));

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
    ownerId: v.optional(v.id("users")),
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
    .index("by_owner", ["ownerId"])
    .index("by_cohort", ["cohortKey"])
    .index("by_status", ["status"]),

  brands: defineTable({
    ownerId: v.optional(v.id("users")),
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
    enrichmentStatus: v.optional(enrichmentStatus),
    isOwnBrand: v.optional(v.boolean()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_name", ["name"]),

  brandCatalog: defineTable({
    name: v.string(),
    domain: v.string(),
    vertical: v.string(),
    aliases: v.array(v.string()),
    adsTransparencyAdvertiserId: v.optional(v.string()),
    description: v.optional(v.string()),
    featured: v.boolean(),
  })
    .index("by_vertical", ["vertical"])
    .index("by_name", ["name"]),

  snapshots: defineTable({
    ownerId: v.optional(v.id("users")),
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
    .index("by_owner", ["ownerId"])
    .index("by_run", ["runId"])
    .index("by_brand", ["brandId"])
    .index("by_brand_and_engine", ["brandId", "engine"])
    .index("by_brand_engine_and_region", ["brandId", "engine", "region"]),

  claims: defineTable({
    ownerId: v.optional(v.id("users")),
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
    audienceHint: v.optional(v.string()),
    confidence: v.optional(confidence),
    taggedClaimId: v.optional(v.id("claims")),
    tagMode: v.optional(v.union(v.literal("llm"), v.literal("template"))),
    seller: v.optional(v.string()),
    image: v.optional(v.string()),
    totalDaysShown: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_run", ["runId"])
    .index("by_run_and_brand", ["runId", "brandId"])
    .index("by_brand", ["brandId"])
    .index("by_snapshot", ["snapshotId"])
    .index("by_brand_and_metric", ["brandId", "metric"]),

  briefs: defineTable({
    ownerId: v.optional(v.id("users")),
    runId: v.id("runs"),
    cohortKey: v.string(),
    brandIds: v.array(v.id("brands")),
    generatedAt: v.string(),
    briefText: v.string(),
    claimIds: v.array(v.id("claims")),
    mode: v.union(v.literal("llm"), v.literal("template")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_run", ["runId"])
    .index("by_cohort_and_generatedAt", ["cohortKey", "generatedAt"])
    .index("by_generatedAt", ["generatedAt"]),

  brandInsights: defineTable({
    ownerId: v.optional(v.id("users")),
    brandId: v.id("brands"),
    generatedAt: v.string(),
    sentences: v.array(v.object({
      text: v.string(),
      citedClaimIds: v.array(v.id("claims")),
    })),
    claimIds: v.array(v.id("claims")),
    mode: v.union(v.literal("llm"), v.literal("template"), v.literal("failed")),
    failureReason: v.optional(v.string()),
    claimCountAtGeneration: v.number(),
    sourceRunId: v.optional(v.id("runs")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_brand_and_generatedAt", ["brandId", "generatedAt"]),

  messages: defineTable({
    ownerId: v.optional(v.id("users")),
    threadKey: v.string(),
    runId: v.optional(v.id("runs")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    citations: v.array(v.string()),
    createdAt: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_thread_and_createdAt", ["threadKey", "createdAt"]),

  threadTitles: defineTable({
    ownerId: v.id("users"),
    threadKey: v.string(),
    title: v.string(),
    updatedAt: v.string(),
  }).index("by_owner_and_threadKey", ["ownerId", "threadKey"]),

  llmUsage: defineTable({
    ownerId: v.optional(v.id("users")),
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
    costBasis: v.optional(
      v.union(v.literal("upstream_inference"), v.literal("total")),
    ),
    estimatedCostUsd: v.optional(v.number()),
    createdAt: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_run", ["runId"])
    .index("by_thread_and_createdAt", ["threadKey", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  agentEvents: defineTable({
    ownerId: v.optional(v.id("users")),
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
    stepIndex: v.optional(v.number()),
    planStepId: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_thread_and_seq", ["threadKey", "seq"])
    .index("by_run", ["runId"]),

  threadLedger: defineTable({
    ownerId: v.id("users"),
    threadKey: v.string(),
    claimId: v.string(),
    n: v.number(),
    text: v.string(),
    value: v.optional(v.union(v.string(), v.number())),
    unit: v.optional(v.string()),
    evidenceUrl: v.string(),
    sourceEngine,
    fetchedAt: v.string(),
    createdAt: v.string(),
  })
    .index("by_thread_and_n", ["threadKey", "n"])
    .index("by_owner", ["ownerId"]),

  boards: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    createdAt: v.string(),
  })
    .index("by_owner", ["ownerId"]),

  boardItems: defineTable({
    ownerId: v.id("users"),
    boardId: v.id("boards"),
    claimId: v.id("claims"),
    note: v.optional(v.string()),
    createdAt: v.string(),
    context: v.optional(
      v.object({
        question: v.optional(v.string()),
        threadKey: v.optional(v.string()),
        pageLabel: v.optional(v.string()),
      }),
    ),
  })
    .index("by_owner", ["ownerId"])
    .index("by_board", ["boardId"])
    .index("by_board_and_claim", ["boardId", "claimId"]),
  ...authTables,
});
