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
import type {
  LanguageModel,
  LanguageModelUsage,
  ModelMessage,
  UIMessage,
} from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  toChatChunk,
  type ChatToolName,
  type PlanStep,
} from "@/lib/chatEvents";
import {
  aliasForTask,
  checkLLMBudget,
  defaultBudgetForTask,
  estimateCostUsd,
} from "@/convex/lib/modelRouter";
import { activeProvider, toOpenRouterModelId } from "@/convex/lib/llmClient";

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

type LLMProvider = "gateway" | "openrouter" | "google";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function openRouterCostFrom(
  providerMetadata: unknown,
  responseBody: unknown,
): number | undefined {
}

function resolveModel(): { model: LanguageModel; provider: LLMProvider } | null {
  const active = activeProvider();
  if (active === "gateway") {
    const gatewayKey = process.env.AI_GATEWAY_API_KEY;
    return { model: gateway(`google/${MODEL_FAST}`), provider: "gateway" };
  }
  if (active === "openrouter") {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openrouter = createOpenRouter({ apiKey: openRouterKey });
  }
  if (active === "google") {
    if (geminiKey === undefined || geminiKey.trim() === "") return null;
  }
  return null;
}

function convexClient(): ConvexHttpClient | null {
  if (url === undefined || url.trim() === "") return null;
}

export async function POST(req: Request): Promise<Response> {
  let body: ChatRequestBody;

  const rawBrandIds = Array.isArray(body.brandIds) ? body.brandIds : [];
  if (rawBrandIds.length > MAX_BRANDS_PER_RUN) {
    return Response.json(
      { error: `Too many brands: limit is ${MAX_BRANDS_PER_RUN}` },
      { status: 400 },
    );
  }
  const brandIds = rawBrandIds;
  const allowed = new Set(brandIds);
  const threadKey = [...brandIds].sort().join(":");
  const history = Array.isArray(body.history) ? body.history : [];
  if (hasMessage === false && hasMessages === false) {
    return Response.json(
      { error: "Provide message or messages" },
      { status: 400 },
    );
  }

  const convex = convexClient();
  if (convex === null) {
    return Response.json({ error: "Convex URL is not configured" }, { status: 500 });
  }

  let resolvedModel: { model: LanguageModel; provider: LLMProvider } | null;
  if (resolvedModel === null) {
    return Response.json(
      {
        error:
          "No model key configured (AI_GATEWAY_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY)",
      },
      { status: 503 },
    );
  }
  const { model, provider } = resolvedModel;

  let used = { requests: 0, tokens: 0 };

  let modelMessages: ModelMessage[] | undefined;

  let storedPrior: ModelMessage[] = [];
  try {
    const recent = await convex.query(api.messages.listRecent, {
      threadKey,
      limit: RECENT_TURNS,
    });
    const clientCount = Array.isArray(body.messages) ? body.messages.length : 0;
  } catch {
    storedPrior = [];
  }

  const storedContext = storedPrior.map(
    (message) =>
      `${message.role}: ${
        typeof message.content === "string" ? message.content : ""
      }`,
  );
  const prompt =
    hasMessages === true
      ? undefined
      : [
          `Question: ${clip((body.message as string).trim(), 2000)}`,
          scopedBrands,
          contextLines.length > 0
            ? `Recent context: ${clip(contextLines.slice(-RECENT_TURNS).join(" | "), 600)}`
            : "",
        ]
          .filter((line) => line !== "")
          .join("\n");
  const persistedCitations: string[] = [];
  let pendingLedgerWrite: Promise<void> | undefined;

  function filterScope(inputIds: string[]): { ids: string[]; dropped: number } {
    const ids = inputIds.filter(
      (id) => typeof id === "string" && BRAND_ID_RE.test(id) && allowed.has(id),
    );
  }

  type DurableEventKind =
    | "plan"
    | "step"
    | "tool_call"
    | "answer"
    | "warning"
    | "error";
  type DurableEventStatus =
    | "pending"
    | "running"
    | "complete"
    | "failed"
    | "skipped";

  return createUIMessageStreamResponse({ stream });
}
