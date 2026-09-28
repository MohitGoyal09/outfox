import { ConvexHttpClient } from "convex/browser";
import {
  streamText,
  generateText,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import type { ModelMessage, UIMessage, UIMessageChunk } from "ai";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { createOrchestrationBudget } from "@/convex/lib/modelRouter";
import { classifyComplexity } from "@/convex/lib/typeSafeClient";
import { buildAgentSystemPrompt } from "@/convex/lib/agentPrompt";
import { MAX_BRANDS_PER_RUN, MAX_OUTPUT_TOKENS_PER_STEP, MAX_STEPS } from "@/convex/pipeline/plan";
import { maxOutputTokensForTask } from "@/convex/lib/modelRouter";
import { brandsMentionedIn } from "@/convex/lib/brandMatch";
import { validateCitedMarkdown, linkifyEvidenceRefs, parseEvidenceRefs } from "@/convex/pipeline/citations";
import type { EvidenceRef } from "@/lib/agentTypes";

const SYNTHESIS_MAX_OUTPUT_TOKENS = 8000;
import { appendTurn, clip, extractFollowUps, isTextChunk, logEvent, recordUsage, resolveModelFor, textChunks } from "./shared";
import { buildHistoryMessages, textOfParts } from "./history";
import { buildTools } from "./tools";
import type { TurnState } from "./tools";
import { selectPromptRefs } from "./evidenceBudget";
const ID_RE = /^[a-z0-9_]+$/i;
const MAX_MESSAGE_CHARS = 4000;

type ChatRequest = {
  message?: string;
  messages?: UIMessage[];
  brandIds?: string[];
  cohortKey?: string;
  chatId?: string;
};

function convexClient(token: string): ConvexHttpClient | null {
  if (url === undefined || url.trim() === "") return null;
  return client;
}

function isPureGreeting(text: string): boolean {
}

function toolErrorTextFor(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const match = FAILURE_PREFIX_RE.exec(message);
}

type RunCloseStatus = "complete" | "partial" | "failed";

type RunCloseDecision = { status: RunCloseStatus; errorMessage?: string };
