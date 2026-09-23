"use client";


import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
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
import { answerProvenanceOf, precedingUserTextOf, sourceRowsOf } from "./agentChat-model";
import { MAX_ASK_BRANDS } from "./ask-model";
import { CitationDrawer, type EvidenceDetail } from "./CitationDrawer";
import { SourcesDrawer } from "./SourcesDrawer";
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
  const [openCitation, setOpenCitation] = useState<{ claimId: string; question: string | null } | null>(null);

  const brands = useQuery(api.brands.listBrands);
  const brandNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brands ?? []) map[String(brand._id)] = brand.name;
    return map;
  }, [brands]);
  const claimBrandIds = useMemo(
    () => (brands ?? []).map((brand) => brand._id).slice(0, MAX_ASK_BRANDS),
    [brands],
  );
  const claims = useQuery(api.claims.byBrands, { brandIds: claimBrandIds });
  const claimsById = useMemo(() => {
    const map = new Map<string, Doc<"claims">>();
    for (const claim of claims ?? []) map.set(String(claim._id), claim);
    return map;
  }, [claims]);
  const ledgerRefs = useQuery(
    api.threadLedger.listForThread,
    cohortKey === "" ? "skip" : { threadKey: cohortKey },
  );
  const evidenceById = useMemo(() => {
    const map = new Map<string, EvidenceDetail>();
    for (const ref of ledgerRefs ?? []) map.set(ref.claimId, ref);
    for (const [id, claim] of claimsById) if (!map.has(id)) map.set(id, claim);
    return map;
  }, [ledgerRefs, claimsById]);

  const sourceRows = useMemo(
    () => sourceRowsOf(messages as unknown as { parts?: unknown }[], evidenceById),
    [messages, evidenceById],
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
            messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const precedingUserText = precedingUserTextOf(
                messages as unknown as { role: string; parts?: unknown }[],
                index,
              );
              return (
                <AgentMessage
                  key={message.id}
                  message={message}
                  brandNames={brandNames}
                  claimsById={claimsById}
                  isStreaming={isLastMessage && status === "streaming"}
                  isBusy={isLastMessage && (status === "streaming" || status === "submitted")}
                  question={precedingUserText}
                  threadKey={cohortKey}
                  onRespondToApproval={(id, approved) => void respondToApproval(id, approved)}
                  onOpenCitation={(claimId) => setOpenCitation({ claimId, question: precedingUserText })}
                  onSelectFollowUp={(question) => void submit(question)}
                  onRetry={
                    precedingUserText !== null && !busy ? () => void submit(precedingUserText) : undefined
                  }
                />
              );
            })
          )}
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
      {sourceRows.length > 0 ? (
        <div className="border-t border-border py-4">
          <SourcesDrawer rows={sourceRows} claimsById={claimsById} />
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
      <CitationDrawer
        open={openCitation !== null}
        claim={openCitation !== null ? evidenceById.get(openCitation.claimId) : undefined}
        claimId={(openCitation?.claimId ?? null) as Id<"claims"> | null}
        isStoredClaim={openCitation !== null && claimsById.has(openCitation.claimId)}
        question={openCitation?.question ?? null}
        threadKey={cohortKey}
        onOpenChange={(open) => {
          if (!open) setOpenCitation(null);
        }}
      />
    </section>
  );
}
