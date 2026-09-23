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
import { buildCohortKey } from "@/convex/pipeline/brandProfile";
import { validateCitedMarkdown, linkifyEvidenceRefs, parseEvidenceRefs } from "@/convex/pipeline/citations";
import type { EvidenceRef } from "@/lib/agentTypes";

const SYNTHESIS_MAX_OUTPUT_TOKENS = 8000;
import { appendTurn, clip, extractFollowUps, isTextChunk, logEvent, recordUsage, resolveModelFor, textChunks } from "./shared";
import { buildHistoryMessages, textOfParts } from "./history";
import { buildTools } from "./tools";
import type { TurnState } from "./tools";
const ID_RE = /^[a-z0-9_]+$/i;
const MAX_MESSAGE_CHARS = 4000;

type ChatRequest = {
  message?: string;
  messages?: UIMessage[];
  brandIds?: string[];
  cohortKey?: string;
};

function convexClient(token: string): ConvexHttpClient | null {
  if (url === undefined || url.trim() === "") return null;
  return client;
}

function isPureGreeting(text: string): boolean {
}

export async function POST(request: Request): Promise<Response> {

  const brandIds = Array.isArray(body.brandIds) ? body.brandIds : [];
  if (brandIds.length > MAX_BRANDS_PER_RUN || brandIds.some((id) => typeof id !== "string" || !ID_RE.test(id))) {
    return Response.json({ error: `Invalid brand scope (maximum ${MAX_BRANDS_PER_RUN} brands)` }, { status: 400 });
  }

  const token = await resolveAuthToken(request);
  if (uiMessages.length === 0) return Response.json({ error: "Provide message or messages" }, { status: 400 });
  if (latestUserText.length > MAX_MESSAGE_CHARS) {
    return Response.json({ error: `Message is too long (maximum ${MAX_MESSAGE_CHARS} characters)` }, { status: 400 });
  }

  if (isPureGreeting(latestUserText)) {
    const reply = "Hi! Ask me to compare brands, check a trend, or dig into the evidence behind any signal.";
    await appendTurn(convex, { threadKey, role: "user", text: latestUserText, citations: [] });
    return createUIMessageStreamResponse({ stream });
  }
  if (fastModel === null || reasoningModel === null) {
    return createUIMessageStreamResponse({ stream });
  }

  await appendTurn(convex, { threadKey, role: "user", text: latestUserText, citations: [] });

  if (classification.needsClarification) {
    const clarifyText =
      brandIds.length === 0
        ? "Which brand would you like to know about? Name it (or pick one you're tracking) and I'll look it up."
        : "What would you like to know about the selected brand(s) -- a specific metric, a comparison, or a time window?";
    await logEvent(convex, {
      threadKey,
      kind: "plan",
      name: "classify",
      status: "complete",
      detail: classification.reason,
      payload: { tier: classification.tier, needsClarification: true },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const tier = classification.tier;

  const state: TurnState = {
    ledgerRefs: [...priorRefs],
    knownBrandIds: new Set(brandIds),
    untrackedBrand: null,
    toolCallCount: 0,
    stepStates: [],
  };
  const tools = buildTools({ convex, threadKey, state });
  const baseMessages: ModelMessage[] = await convertToModelMessages(history);
  const maxSteps = tier === "COMPLEX" ? COMPLEX_MAX_STEPS : MAX_STEPS;
  const phase1Messages: ModelMessage[] =
    planText !== null
      ? [
          ...baseMessages,
          { role: "assistant", content: planText },
          { role: "user", content: "Execute that plan now, one step at a time, using the tools available." },
        ]
      : baseMessages;
  let budgetExhausted = false;

  const stream = createUIMessageStream({
    onError: (error) => {
      console.error("[chat] stream failed:", error instanceof Error ? (error.stack ?? error.message) : String(error));
    },
    execute: async ({ writer }) => {
      if (toolsEnabled && budget.canSpend(0)) {
        for await (const chunk of uiStream) {
        }
        if (!budget.canSpend(0)) budgetExhausted = true;
      }

      if (toolsEnabled && state.toolCallCount === 0) {
        const answerText = "The tools this turn did not return grounded evidence for a confident answer.";
        writer.write({
          type: "data-answer-meta",
          data: { mode: "template" as const, sources: [], citationSources: {}, untrackedBrand: state.untrackedBrand, followUps: [] },
        });
        writer.write({ type: "text-start", id });
        for (const piece of textChunks(answerText)) writer.write({ type: "text-delta", id, delta: piece });
        writer.write({ type: "text-end", id });
        return;
      }
      if ((budgetExhausted || !budget.canSpend(0)) && gatheredSoFar === 0) {
        writer.write({
          type: "data-answer-meta",
          data: { mode: "template" as const, sources: [], citationSources: {}, untrackedBrand: state.untrackedBrand, followUps: [] },
        });
        writer.write({ type: "text-start", id });
        for (const piece of textChunks(answerText)) writer.write({ type: "text-delta", id, delta: piece });
        writer.write({ type: "text-end", id });
        return;
      }

      const nudge = toolsEnabled
        ? "Write your final answer now, in Markdown. Cite every sentence that carries a number, date, percentage, or named creative with [n] using the evidence numbers the tools returned above -- never a Convex id. State the data's asOf date. If nothing useful was found, say so plainly."
        : undefined;
      const MAX_EVIDENCE_REFS_IN_PROMPT = 40;
      const evidenceBlock =
        promptRefs.length > 0
          ? [
              "Evidence available to you this turn. Cite these by number, e.g. [3].",
              ...promptRefs.map((r) => {
                const value = r.value === undefined ? "" : ` value=${String(r.value)}${r.unit ?? ""}`;
                return `[${r.n}] (${r.sourceEngine}, ${r.fetchedAt}) ${r.text}${value}`;
              }),
            ].join("\n")
          : undefined;

      const synthesisMessages: ModelMessage[] = toolsEnabled
        ? [
            ...baseMessages,
            ...(evidenceBlock !== undefined ? [{ role: "user" as const, content: evidenceBlock }] : []),
            ...(nudge !== undefined ? [{ role: "user" as const, content: nudge }] : []),
          ]
        : baseMessages;

      const startedAt = Date.now();
      budget.record(1, synthResult.usage.totalTokens ?? 0);

      const { body: synthBody, followUps } = extractFollowUps(synthResult.text);
      const allRefs = promptRefs;
      const { kept, dropped } = validateCitedMarkdown(synthBody, allRefs);
      const linked = linkifyEvidenceRefs(kept, allRefs);
      const citationSources: Record<string, { url: string; engine: string }> = {};
      const sourcesByUrl = new Map<string, { url: string; engine: string }>();
      for (const ref of allRefs) {
        if (!citedClaimIds.has(ref.claimId)) continue;
        citationSources[ref.claimId] = { url: ref.evidenceUrl, engine: ref.sourceEngine };
        sourcesByUrl.set(ref.evidenceUrl, { url: ref.evidenceUrl, engine: ref.sourceEngine });
      }

      writer.write({
        type: "data-answer-meta",
        data: {
          mode: hasAnswer ? ("llm" as const) : ("template" as const),
          sources: [...sourcesByUrl.values()],
          citationSources,
          untrackedBrand: state.untrackedBrand,
          followUps,
        },
      });

      const answerId = "final-answer";

      await logEvent(convex, {
        threadKey,
        ...(runId !== undefined ? { runId } : {}),
        kind: "answer",
        name: "answer",
        status: "complete",
        detail: clip(answerText, 300),
        payload: { citations: [...citedClaimIds], droppedCount: dropped.length },
      });
      await appendTurn(convex, { threadKey, role: "assistant", text: answerText, citations: [...citedClaimIds] });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
