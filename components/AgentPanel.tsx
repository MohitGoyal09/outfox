"use client";

import { WorkflowProgress, stepStateFromToolState } from "@/components/WorkflowProgress";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  isChatEvent,
  parseChatChunk,
  type PlanEvent,
  type ToolStatusEvent,
  type UsageEvent,
} from "@/lib/chatEvents";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo } from "react";

type ToolPartView = {
  key: string;
  name: string;
  state: string;
  approvalId?: string;
  approved?: boolean;
};

function toolPartsOf(message: { parts?: unknown }): ToolPartView[] {
  const parts = (message as { parts?: unknown[] }).parts ?? [];
  const out: ToolPartView[] = [];
  for (const raw of parts) {
    const part = raw as Record<string, unknown>;
    const type = typeof part["type"] === "string" ? (part["type"] as string) : "";
    if (!type.startsWith("tool-") && type !== "dynamic-tool") continue;
    const name =
      type === "dynamic-tool"
        ? String((part["toolName"] as string) ?? "tool")
        : type.replace(/^tool-/, "");
    const state = typeof part["state"] === "string" ? (part["state"] as string) : "pending";
    const approval = part["approval"] as { id?: string; approved?: boolean } | undefined;
    out.push({
      key: String((part["toolCallId"] as string) ?? `${name}-${out.length}`),
      name,
      state,
      ...(approval?.id ? { approvalId: approval.id } : {}),
      ...(approval?.approved !== undefined ? { approved: approval.approved } : {}),
    });
  }
  return out;
}

function textOf(message: { parts?: unknown }): string {
  const parts = (message as { parts?: unknown[] }).parts ?? [];
  return parts
    .map((raw) => {
      const part = raw as Record<string, unknown>;
      if (part["type"] === "text") return String(part["text"] ?? "");
      if (part["type"] === "source-url") return String(part["url"] ?? "");
      return "";
    })
    .join("");
}

function sourceUrlsOf(message: { parts?: unknown }): { url: string; title?: string }[] {
  const parts = (message as { parts?: unknown[] }).parts ?? [];
  const out: { url: string; title?: string }[] = [];
  for (const raw of parts) {
    const part = raw as Record<string, unknown>;
    if (part["type"] !== "source-url") continue;
    const url = typeof part["url"] === "string" ? part["url"] : "";
    if (url === "") continue;
    out.push({
      url,
      ...(typeof part["title"] === "string" ? { title: part["title"] } : {}),
    });
  }
  return out;
}

function chatEventsOf(messages: { parts?: unknown }[]): {
  toolStatuses: ToolStatusEvent[];
  plans: PlanEvent[];
  usages: UsageEvent[];
} {
  const toolStatuses: ToolStatusEvent[] = [];
  const plans: PlanEvent[] = [];
  const usages: UsageEvent[] = [];
  for (const message of messages) {
    const parts = (message as { parts?: unknown[] }).parts ?? [];
    for (const raw of parts) {
      const part = raw as Record<string, unknown>;
      const type = typeof part["type"] === "string" ? (part["type"] as string) : "";
      if (type.startsWith("data-") === false) continue;
      const event = parseChatChunk(type, part["data"]);
      if (event === null || isChatEvent(event) === false) continue;
      if (event.type === "tool-status") toolStatuses.push(event);
      else if (event.type === "plan") plans.push(event);
      else if (event.type === "usage") usages.push(event);
    }
  }
  return { toolStatuses, plans, usages };
}

type AnswerProvenance = {
  mode: "llm" | "template";
  classifier: "typesafe" | "fallback" | "unknown";
};

function answerProvenanceOf(messages: { parts?: unknown }[]): AnswerProvenance | null {
  let latest: AnswerProvenance | null = null;
  for (const message of messages) {
    const parts = (message as { parts?: unknown[] }).parts ?? [];
    for (const raw of parts) {
      const part = raw as Record<string, unknown>;
      if (part["type"] !== "data-answer-meta") continue;
      const data = part["data"];
      if (typeof data !== "object" || data === null) continue;
      const record = data as Record<string, unknown>;
      const mode = record["mode"];
      const classifier = record["classifier"];
      latest = {
        mode: mode === "template" ? "template" : "llm",
        classifier:
          classifier === "typesafe" || classifier === "fallback"
            ? classifier
            : "unknown",
      };
    }
  }
  return latest;
}

const CLASSIFIER_LABEL: Record<AnswerProvenance["classifier"], string> = {
  typesafe: "TypeSafe",
  fallback: "keyword fallback",
  unknown: "unknown",
};

export function AgentPanel({
  brandIds,
  cohortKey,
  className,
}: {
  brandIds: string[];
  cohortKey: string;
  className?: string;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { brandIds, cohortKey },
      }),
    [brandIds, cohortKey],
  );
  const {
    messages,
    sendMessage,
    status,
    error,
    clearError,
    addToolApprovalResponse,
    stop,
  } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  const { toolStatuses, plans, usages } = useMemo(
    () => chatEventsOf(messages as unknown as { parts?: unknown }[]),
    [messages],
  );
  const sourceUrls = useMemo(
    () =>
      (messages as unknown as { parts?: unknown }[]).flatMap((m) =>
        sourceUrlsOf(m),
      ),
    [messages],
  );
  const provenance = useMemo(
    () => answerProvenanceOf(messages as unknown as { parts?: unknown }[]),
    [messages],
  );

  if (brandIds.length === 0) {
    return (
      <div
        className={cn(
          "border-t border-[var(--border)] py-5 text-sm text-[var(--text-secondary)]",
          className,
        )}
      >
        Pick at least one brand to start the agent.
      </div>
    );
  }

  const allToolSteps = messages.flatMap((m) =>
    toolPartsOf(m as unknown as { parts?: unknown }).map((t) => ({
      id: `${t.name} (${t.key.slice(0, 6)})`,
      capability: t.name,
      status: stepStateFromToolState(t.state),
    })),
  );

  async function submit(text: string) {
    const trimmed = text.trim();
    if (trimmed === "" || busy) return;
    await sendMessage(
      { text: trimmed },
      { body: { brandIds, cohortKey } },
    );
  }

  async function respondToApproval(approvalId: string, approved: boolean) {
    await addToolApprovalResponse({
      id: approvalId,
      approved,
      options: {
        body: {
          brandIds,
          cohortKey,
        },
      },
    });
  }

  const latestPlan = plans.length > 0 ? plans[plans.length - 1] : null;
  const latestUsage = usages.length > 0 ? usages[usages.length - 1] : null;

  return (
    <section
      aria-label="Agent"
      className={cn(
        "flex min-h-[420px] flex-col border-t border-[var(--border)]",
        className,
      )}
    >
      <header className="border-b border-[var(--border)] py-5">
        <h2 className="type-title text-[var(--text-primary)]">
          Agent
        </h2>
        <p className="mt-1 max-w-[68ch] text-sm text-[var(--text-secondary)]">
          Streams from /api/chat. Tool calls appear below as started then
          finished. Refresh needs your approval.
        </p>
      </header>
      <Conversation className="min-h-[280px]">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="No agent messages yet"
              description="Ask about these brands. The plan and tool progress show here."
            />
          ) : (
            messages.map((message) => {
              const tools = toolPartsOf(
                message as unknown as { parts?: unknown },
              );
              const text = textOf(message as unknown as { parts?: unknown });
              return (
                <Message
                  key={message.id}
                  from={message.role as "user" | "assistant"}
                >
                  <MessageContent>
                    {text !== "" ? (
                      <MessageResponse>{text}</MessageResponse>
                    ) : null}
                    {tools.length > 0 ? (
                      <WorkflowProgress steps={tools.map((t) => ({
                        id: `${t.name} (${t.key.slice(0, 6)})`,
                        capability: t.name,
                        status: stepStateFromToolState(t.state),
                      }))} title="Tool progress" />
                    ) : null}
                    {(message.parts ?? []).map((raw) => {
                      const part = raw as Record<string, unknown>;
                      const type =
                        typeof part["type"] === "string"
                          ? (part["type"] as string)
                          : "";
                      if (!type.startsWith("tool-") && type !== "dynamic-tool")
                        return null;
                      const state =
                        typeof part["state"] === "string"
                          ? (part["state"] as string)
                          : "";
                      if (state !== "approval-requested") return null;
                      const approval = part["approval"] as
                        | { id: string; approved?: boolean }
                        | undefined;
                      const toolCallId = String(
                        (part["toolCallId"] as string) ?? type,
                      );
                      const toolName =
                        type === "dynamic-tool"
                          ? String(
                              (part["toolName"] as string) ?? "tool",
                            )
                          : type.replace(/^tool-/, "");
                      return (
                        <Confirmation
                          key={toolCallId}
                          approval={approval}
                          state={
                            state as "approval-requested" | "output-available"
                          }
                        >
                          <ConfirmationTitle>
                            {toolName} needs approval
                            {toolName.includes("refresh")
                              ? " before any fetch runs"
                              : ""}
                            .
                          </ConfirmationTitle>
                          <ConfirmationRequest>
                            <p className="text-sm text-muted-foreground">
                              Approve once to let this step run
                              {toolName.includes("refresh")
                                ? " a single live refresh"
                                : ""}
                              .
                            </p>
                          </ConfirmationRequest>
                          <ConfirmationActions>
                            <ConfirmationAction
                              variant="outline"
                              onClick={() =>
                                approval?.id &&
                                void respondToApproval(approval.id, false)
                              }
                            >
                              Deny
                            </ConfirmationAction>
                            <ConfirmationAction
                              onClick={() =>
                                approval?.id &&
                                void respondToApproval(approval.id, true)
                              }
                            >
                              Accept
                            </ConfirmationAction>
                          </ConfirmationActions>
                          <ConfirmationAccepted>
                            <p className="text-sm text-muted-foreground">
                              Approved. The agent runs this refresh once.
                            </p>
                          </ConfirmationAccepted>
                          <ConfirmationRejected>
                            <p className="text-sm text-muted-foreground">
                              Denied. The agent continues on stored data.
                            </p>
                          </ConfirmationRejected>
                        </Confirmation>
                      );
                    })}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {toolStatuses.length > 0 ? (
            <div
              aria-label="Live tool events"
              className="border border-[var(--border)] bg-[var(--bg-inset)] p-3 text-sm"
            >
              <p className="font-medium text-[var(--text-primary)]">Live tool events</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {toolStatuses.map((event, index) => (
                  <li key={`${event.tool}-${index}`}>
                    {event.tool}: {event.state}
                    {event.state === "finished"
                      ? ` in ${event.latencyMs}ms`
                      : ""}
                    {event.summary ? ` — ${event.summary}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {latestPlan && latestPlan.steps.length > 0 ? (
            <WorkflowProgress
              steps={latestPlan.steps.map((step) => ({
                id: step.id,
                ...(step.capability ?? step.tool
                  ? { capability: step.capability ?? step.tool }
                  : {}),
                status:
                  step.status === "finished" || step.status === "complete"
                    ? ("complete" as const)
                    : step.status === "failed"
                      ? ("failed" as const)
                      : step.status === "running"
                        ? ("running" as const)
                        : ("pending" as const),
              }))}
              title={
                latestPlan.goal ? `Plan: ${latestPlan.goal}` : "Plan"
              }
            />
          ) : null}
          {latestUsage ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Usage: {latestUsage.requests} requests
              {latestUsage.credits !== undefined
                ? ` · ${latestUsage.credits} credits`
                : ""}
              .
            </p>
          ) : null}
          {provenance ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Answer:{" "}
              {provenance.mode === "llm" ? "model" : "raw claims"} · classifier:{" "}
              {CLASSIFIER_LABEL[provenance.classifier]}
            </p>
          ) : null}
          {provenance?.mode === "template" ? (
            <p
              role="status"
              className="border border-[var(--border)] bg-[var(--bg-inset)] px-2 py-1 text-xs text-[var(--text-secondary)]"
            >
              Model unavailable, showing raw claims.
            </p>
          ) : null}
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Agent is streaming.
            </p>
          ) : null}
          {error ? (
            <div className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
              Agent request failed: {error.message}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => clearError()}
              >
                Dismiss
              </Button>
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {sourceUrls.length > 0 ? (
        <div className="border-t border-[var(--border)] py-4">
          <Sources>
            <SourcesTrigger count={sourceUrls.length}>
              {`Used ${sourceUrls.length} sources`}
            </SourcesTrigger>
            <SourcesContent>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {sourceUrls.map((source) => (
                  <li key={source.url} className="break-all">
                    {source.title ?? source.url}
                  </li>
                ))}
              </ul>
            </SourcesContent>
          </Sources>
        </div>
      ) : allToolSteps.length > 0 ? (
        <div className="border-t border-[var(--border)] py-4">
          <p className="text-xs text-[var(--text-secondary)]">
            {allToolSteps
              .map((s) => `${s.capability}: ${s.status}`)
              .join(" · ")}
          </p>
        </div>
      ) : null}
      <div className="border-t border-[var(--border)] py-4">
        <PromptInput onSubmit={(message) => void submit(message.text)}>
          <PromptInputTextarea
            placeholder="Ask the agent about these brands"
          />
          <div className="flex items-center justify-between gap-2 p-2">
            <p className="text-xs text-[var(--text-secondary)]">
              Refresh stays locked until you accept.
            </p>
            <div className="flex gap-2">
              {busy ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void stop()}
                >
                  Stop
                </Button>
              ) : null}
              <PromptInputSubmit status={status} />
            </div>
          </div>
        </PromptInput>
      </div>
    </section>
  );
}
