"use client";


import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { AgentMessage } from "./AgentMessage";
import { answerProvenanceOf, sourcesOf } from "./agentChat-model";
import { SourcesDrawer } from "./SourcesDrawer";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { useAgentChat } from "./useAgentChat";

export function AgentChat({
  brandIds,
  cohortKey,
  className,
}: {
  brandIds: string[];
  cohortKey: string;
  className?: string;
}) {
  const {
    messages,
    sendMessage,
    status,
    error,
    clearError,
    addToolApprovalResponse,
    stop,
    busy,
  } = useAgentChat({ brandIds, cohortKey });

  const [draft, setDraft] = useState("");

  const sources = useMemo(
    () => sourcesOf(messages as unknown as { parts?: unknown }[]),
    [messages],
  );
  const provenance = useMemo(
    () => answerProvenanceOf(messages as unknown as { parts?: unknown }[]),
    [messages],
  );

  async function submit(text: string) {
    const trimmed = text.trim();
    if (trimmed === "" || busy) return;
    setDraft("");
    await sendMessage({ text: trimmed }, { body: { brandIds, cohortKey } });
  }

  async function respondToApproval(approvalId: string, approved: boolean) {
    await addToolApprovalResponse({
      id: approvalId,
      approved,
      options: { body: { brandIds, cohortKey } },
    });
  }

  return (
    <section
      aria-label="Ask about these rivals"
      className={cn("flex min-h-[420px] flex-col border-t border-border", className)}
    >
      <header className="border-b border-border py-5">
        <h2 className="type-title text-fg">Ask about these rivals</h2>
        <p className="mt-1 max-w-[68ch] text-sm text-fg-secondary">
          Every tool call and source shows here as it runs. A live refresh always
          asks first.
        </p>
      </header>
      <Conversation className="min-h-[280px]">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Ask about these brands"
              description="Tool calls and sources show up here as the agent works."
            />
          ) : (
            messages.map((message) => (
              <AgentMessage
                key={message.id}
                message={message}
                onRespondToApproval={(id, approved) => void respondToApproval(id, approved)}
              />
            ))
          )}
          {busy ? <ThinkingIndicator /> : null}
          {provenance?.mode === "template" ? (
            <Chip tone="warn" label="Model unavailable — showing raw claims" />
          ) : null}
          {error ? (
            <div className="rounded-[8px] border border-danger p-3 text-sm text-danger">
              Something went wrong: {error.message}
              <Button variant="outline" size="sm" className="ml-2" onClick={() => clearError()}>
                Dismiss
              </Button>
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {sources.length > 0 ? (
        <div className="border-t border-border py-4">
          <SourcesDrawer sources={sources} />
        </div>
      ) : null}
      <div className="border-t border-border py-4">
        <PromptInput
          onSubmit={(message) => void submit(message.text)}
          className="rounded-3xl border border-border/70 bg-bg-raised shadow-[var(--shadow-lift)] transition-shadow duration-150 ease-out focus-within:shadow-[var(--shadow-toast)]"
        >
          <PromptInputBody>
            <PromptInputTextarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about these rivals"
              className="max-h-[300px] overflow-y-auto bg-transparent text-fg placeholder:text-fg-placeholder"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <span className="hidden items-center gap-1.5 text-xs text-fg-tertiary sm:flex">
                <ShieldCheck className="size-3.5 text-ok" /> A live refresh always asks first
              </span>
            </PromptInputTools>
            <PromptInputSubmit
              status={status}
              onStop={() => void stop()}
              disabled={busy ? false : draft.trim() === ""}
              className="rounded-full bg-accent text-accent-ink hover:bg-accent-strong disabled:bg-bg-inset disabled:text-fg-tertiary disabled:opacity-50"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
