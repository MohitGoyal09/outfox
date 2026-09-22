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
import {
  MAX_BRANDS_PER_RUN,
  MAX_OUTPUT_TOKENS_PER_STEP,
  MAX_STEPS,
  WEB_SEARCH_MAX_CALLS_PER_TURN,
} from "@/convex/pipeline/plan";
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

function isPureGreeting(text: string): boolean {
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
  sources: Map<string, { url: string; engine: string }>;
};

const SYSTEM_PROMPT = [
  "You are Drishti's brand research agent. You answer only from tool results.",
  "A greeting, thanks, or small talk with no research question in it needs no tool call at all -- call respond right away with a short, friendly reply (no citation required for a reply like this, since it makes no factual claim). Do not call resolve_brand or any other tool just to have something to cite.",
  "Use resolve_brand to turn a brand name mentioned in the question into an id when it is not already given.",
  "Use search_claims as the default path to read stored evidence for the brands in scope.",
  "Use get_trends for search-interest questions, compare_brands for any comparison (it computes the numbers -- never compute your own), and web_search only when stored claims cannot answer, at most twice.",
  "A tool result only ever contains the exact numbers, dates, and points it returned -- state only those, and never infer a trend, an average, a change, or a date that is not itself one of the returned values, even when it seems like a reasonable estimate.",
  "refresh_cohort needs the user's approval and only runs after they grant it.",
  "Once you have used a tool this turn, every sentence in your final respond call that states a fact must cite at least one claim id that tool actually returned. Never invent a fact, a number, or a source.",
].join(" ");
