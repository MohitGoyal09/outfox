import crypto from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import {
  streamText,
  stepCountIs,
  hasToolCall,
  convertToModelMessages,
  tool,
  jsonSchema,
  createUIMessageStream,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import type { LanguageModel, UIMessage, ToolSet, UIMessageChunk } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MODEL_FAST } from "@/convex/lib/llmClient";
import { MAX_BRANDS_PER_RUN, MAX_STEPS, WEB_SEARCH_MAX_CALLS_PER_TURN } from "@/convex/pipeline/plan";
import { buildCohortKey } from "@/convex/pipeline/brandProfile";
import { validateBriefSentences } from "@/convex/pipeline/guardrail";
import type { BriefSentence } from "@/convex/pipeline/guardrail";
const ID_RE = /^[a-z0-9_]+$/i;

const FALLBACK_TOOL_APPROVAL_SECRET = crypto.randomBytes(32).toString("hex");

type ChatRequest = {
  message?: string;
  messages?: UIMessage[];
  brandIds?: string[];
  cohortKey?: string;
  history?: string[];
};

function convexClient(token: string): ConvexHttpClient | null {
  if (url === undefined || url.trim() === "") return null;
  return client;
}

function resolveModel(): LanguageModel | null {
  const gatewayKey = (process.env.AI_GATEWAY_API_KEY ?? "").trim();
  if (googleKey !== "") return createGoogleGenerativeAI({ apiKey: googleKey })(base);
  return null;
}


type EventKind = "plan" | "step" | "tool_call" | "answer" | "warning" | "error";
type EventStatus = "pending" | "running" | "complete" | "failed" | "skipped";

async function logEvent(
  convex: ConvexHttpClient,
  event: {
    threadKey: string;
    runId?: Id<"runs">;
    kind: EventKind;
    name: string;
    status: EventStatus;
    detail?: string;
    payload?: unknown;
  },
): Promise<void> {
  try {
    await convex.action(api.agent.logEvent, event);
  } catch {
  }
}


type EvidenceLedger = {
  allowedIds: Set<string>;
  claimTexts: Map<string, string>;
};
