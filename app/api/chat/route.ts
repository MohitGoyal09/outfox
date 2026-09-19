import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
} from "ai";
import type { ModelMessage, UIMessage } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  toChatChunk,
  type ChatToolName,
  type PlanStep,
} from "@/lib/chatEvents";

const MAX_STEPS = 6;

const RECENT_TURNS = 6;

const SYSTEM_PROMPT =
  "You are the Drishti brand agent. Answer only from stored brand signals " +
  "returned by your tools, and cite the claim ids you use. " +
  "Use create_brand to add a brand, get_brand_profile to read one brand, " +
  "compare_brands to compare stored signals, ask_brand_question to answer " +
  "from stored claims, and refresh_brand or refresh_cohort only when the " +
  "user asked for fresh data. Refresh tools need user approval before they " +
  "run: the UI asks for confirmation and the run continues after approval. " +
  "Never invent facts, numbers, or sources.";

type ChatRequestBody = {
  message?: string;
  messages?: UIMessage[];
  brandIds?: string[];
  cohortKey?: string;
  history?: string[];
};

function planStepsOf(output: unknown): { steps: PlanStep[]; goal?: string } | null {
  if (typeof output !== "object" || output === null) return null;
  const plan = (output as Record<string, unknown>)["plan"];
  if (typeof plan !== "object" || plan === null) return null;
  const record = plan as Record<string, unknown>;
  for (const entry of record["steps"] as unknown[]) {
    steps.push({
      id: step["id"],
      ...(typeof step["capability"] === "string"
        ? { capability: step["capability"] }
        : {}),
      ...(typeof step["tool"] === "string" ? { tool: step["tool"] } : {}),
      ...(typeof step["status"] === "string"
        ? { status: step["status"] }
        : {}),
      ...(Array.isArray(step["brandIds"])
        ? { detail: (step["brandIds"] as unknown[]).map(String).join(", ") }
        : {}),
    });
  }
}

type AnswerMode = "llm" | "template";
type ClassifierKind = "typesafe" | "fallback" | "unknown";

function resolveModel() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const geminiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return null;
}

function convexClient(): ConvexHttpClient | null {
  if (url === undefined || url.trim() === "") return null;
}
