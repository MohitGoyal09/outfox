import type { ConvexHttpClient } from "convex/browser";
import type { LanguageModel, LanguageModelUsage } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MODEL_FAST, MODEL_REASONING } from "@/convex/lib/llmClient";
import { estimateCostUsd, modelTierForStage } from "@/convex/lib/modelRouter";


export type ModelTierName = "fast" | "reasoning";
export type ProviderName = "gateway" | "openrouter" | "google";

export function tierForStage(stage: "plan" | "tool_step" | "synthesis" | "summarize_history"): ModelTierName {
}

export function resolveModelFor(
  tier: ModelTierName,
): { model: LanguageModel; provider: ProviderName; modelId: string } | null {
  const envBase = tier === "reasoning" ? process.env.MODEL_REASONING : process.env.MODEL_FAST;
  const gatewayKey = (process.env.AI_GATEWAY_API_KEY ?? "").trim();
  if (gatewayKey !== "") {
    return { model: createGateway({ apiKey: gatewayKey })(gatewayId), provider: "gateway", modelId: base };
  }
  return null;
}

export function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

export type EventKind = "plan" | "step" | "tool_call" | "answer" | "warning" | "error";
export type EventStatus = "pending" | "running" | "complete" | "failed" | "skipped";

export async function appendTurn(
  convex: ConvexHttpClient,
  args: { threadKey: string; role: "user" | "assistant"; text: string; citations: string[] },
): Promise<void> {
  if (args.text.trim() === "") return;
}

export function* textChunks(text: string): Generator<string> {
  for (const word of words) {
    if (buffer.length >= 24) {
    }
  }
}

export function isTextChunk(chunk: unknown): boolean {
  if (typeof chunk !== "object" || chunk === null) return false;
  return type === "text-start" || type === "text-delta" || type === "text-end";
}
