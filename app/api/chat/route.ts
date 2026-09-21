import { ConvexHttpClient } from "convex/browser";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toChatChunk, type ChatToolName, type PlanStep } from "@/lib/chatEvents";
const ID_RE = /^[a-z0-9_]+$/i;

type ChatRequest = {
  message?: string;
  messages?: Array<{ role?: string; parts?: unknown[] }>;
  brandIds?: string[];
  history?: string[];
};

type OrchestrateResult = {
  answer?: string;
  message?: string;
  mode?: "llm" | "template";
  plan?: { goal?: string; steps: Array<{ id: string; capability?: string; brandIds?: string[] }> };
  stepStates?: Array<{ id: string; status: string; error?: string }>;
  classification?: { classifier?: string };
  usage?: { llmRequests?: number };
};

function convexClient(): ConvexHttpClient | null {
  return url && url.trim() !== "" ? new ConvexHttpClient(url) : null;
}

function planSteps(plan: unknown): PlanStep[] {
  if (typeof plan !== "object" || plan === null) return [];
  const steps = (plan as Record<string, unknown>).steps;
}
