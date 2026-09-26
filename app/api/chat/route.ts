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

export async function POST(request: Request): Promise<Response> {

  const brandIds = Array.isArray(body.brandIds) ? body.brandIds : [];
  if (brandIds.length > MAX_BRANDS_PER_RUN || brandIds.some((id) => typeof id !== "string" || !ID_RE.test(id))) {
    return Response.json({ error: `Invalid brand scope (maximum ${MAX_BRANDS_PER_RUN} brands)` }, { status: 400 });
  }

  const token = await resolveAuthToken(request);

  const threadKey =
    typeof body.chatId === "string" && body.chatId !== ""
      ? body.chatId
      : typeof body.cohortKey === "string" && body.cohortKey !== ""
        ? body.cohortKey
        : "";
  if (uiMessages.length === 0) return Response.json({ error: "Provide message or messages" }, { status: 400 });
  const isApprovalContinuation = uiMessages.some((message) =>
    (message.parts ?? []).some(
      (part) => (part as { state?: string }).state === "approval-responded",
    ),
  );
  const isDeniedApproval = uiMessages.some((message) =>
    (message.parts ?? []).some((part) => {
      const p = part as { state?: string; approval?: { approved?: boolean } };
      return p.state === "approval-responded" && p.approval?.approved === false;
    }),
  );
  if (!isApprovalContinuation && latestUserText.length > MAX_MESSAGE_CHARS) {
    return Response.json({ error: `Message is too long (maximum ${MAX_MESSAGE_CHARS} characters)` }, { status: 400 });
  }
  if (fastModel === null || reasoningModel === null) {
    return createUIMessageStreamResponse({ stream });
  }
  const threadHasEvidence = priorRefs.length > 0;
  let ownBrand: { _id: unknown; name: string } | null = null;
  try {
    ownBrand = await convex.query(api.brands.getOwnBrand, {});
  } catch {
  }
  const mentioned = brandsMentionedIn(latestUserText, ownedBrands, undefined, ownBrand);
  const combinedBrandIds = [...new Set([...brandIds, ...mentioned.map((match) => match.brandId)])];
  const scopedBrandIds = combinedBrandIds.slice(0, MAX_BRANDS_PER_RUN);

  if (!isApprovalContinuation) {
    await appendTurn(convex, { threadKey, role: "user", text: latestUserText, citations: [] });
  }

  if (classification.needsClarification && !threadHasEvidence) {
    const clarifyText =
      scopedBrandIds.length === 0
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
  const tools = buildTools({ convex, threadKey, state });

  const history = isApprovalContinuation
    ? uiMessages
    : await buildHistoryMessages(convex, threadKey, uiMessages, fastModel);
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
  let pendingApproval = false;

  const stream = createUIMessageStream({
    onError: (error) => {
      console.error("[chat] stream failed:", error instanceof Error ? (error.stack ?? error.message) : String(error));
    },
    execute: async ({ writer }) => {
      try {
      if (toolsEnabled && budget.canSpend(0)) {

        const uiStream = toUIMessageStream({
          stream: result1.stream,
          sendReasoning: false,
          onError: toolErrorTextFor,
        }) as unknown as AsyncIterable<UIMessageChunk>;
        for await (const chunk of uiStream) {
        }
        if (!budget.canSpend(0)) budgetExhausted = true;
      }

      if (toolsEnabled && state.toolCallCount === 0) {
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
      const { kept: visibleRefs, omitted } = selectPromptRefs(
        state.ledgerRefs,
        MAX_EVIDENCE_REFS_IN_PROMPT,
      );
      const evidenceBlock =
        promptRefs.length > 0
          ? [
              "Evidence available to you this turn. Cite these by number, e.g. [3].",
              ...(omitted > 0
                ? [
                    `${omitted} earlier evidence lines are not shown here. Do not state that a hook, source, or metric is absent -- if no count line below shows it, say you did not see it this turn.`,
                  ]
                : []),
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
      } catch (error) {
        throw error;
      } finally {
        if (runId !== undefined) {
          const decision =
            closeDecision ??
            decideRunClose({ kind: "exception", message: "turn ended without a recorded outcome" });
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
