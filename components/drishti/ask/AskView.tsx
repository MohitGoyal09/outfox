"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, CircleAlert, Paperclip, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Sidebar } from "@/components/drishti/chrome/Sidebar";
import { Button } from "../Button";
import { LABEL_CLASS, STATE_TRANSITION_CLASS, iconProps } from "../tokens";
import { AgentMessage } from "./AgentMessage";
import {
  BrandMentionMenu,
  filterMentionBrands,
  mentionOptionId,
  type MentionBrand,
} from "./BrandMentionMenu";
import {
  MAX_ASK_BRANDS,
  brandIdsFromCohortKey,
  mergeAskBrandIds,
  type AskScope,
  type ToolCallCardView,
} from "./ask-model";
import { precedingUserTextOf, sourceRowsOf } from "./agentChat-model";
import { CitationDrawer, type EvidenceDetail } from "./CitationDrawer";
import { PromptCategories } from "./PromptCategories";
import { SourcesDrawer } from "./SourcesDrawer";
import { useAgentChat } from "./useAgentChat";
import { toolCardsByAssistantTurn, useAskTraceEvents } from "./useAskTrace";

const MENTION_TOKEN_RE = /@([^\s@]*)$/;
const ASK_MAX_CHARS = 2000;

function ComposerAttachButton({ disabled }: { disabled: boolean }) {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      aria-label="Attach a file"
      disabled={disabled}
      onClick={() => attachments.openFileDialog()}
      className={cn(
        "size-8 rounded-full border border-transparent bg-bg-inset text-fg-secondary",
        STATE_TRANSITION_CLASS,
        "hover:border-border-strong hover:bg-bg-raised-2 hover:text-fg",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <Paperclip className="size-3.5" aria-hidden="true" />
    </PromptInputButton>
  );
}

function greetingWord(hour: number): string {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function AskView({
  initialChatId,
  cohortKey,
  initialQuestion,
  initialBrandIds = [],
}: {
  initialChatId: string | null;
  cohortKey: string | null;
  initialQuestion: string | null;
  initialBrandIds?: Id<"brands">[];
}) {
  const brands = useQuery(api.brands.listBrands);
  const me = useQuery(api.users.me);
  const firstName = me?.name?.trim().split(/\s+/)[0] ?? null;
  const [greeting] = useState(() => greetingWord(new Date().getHours()));
  const reduceMotion = useReducedMotion();

  const brandNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brands ?? []) map[String(brand._id)] = brand.name;
    return map;
  }, [brands]);

  const [openClaimId, setOpenClaimId] = useState<string | null>(null);

  const scope: AskScope = useMemo(
    () => ({
      cohortKey,
      brandIds: cohortKey !== null ? brandIdsFromCohortKey(cohortKey) : initialBrandIds,
      runId: null,
    }),
    [cohortKey, initialBrandIds],
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat") ?? initialChatId ?? "";

  const mintChatId = useCallback((): string => {
    const next = `chat-${crypto.randomUUID()}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("chat", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    return next;
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (chatId !== "") return;
    mintChatId();
  }, [chatId, mintChatId]);

  const ensureChatId = useCallback((): string => {
    if (chatId !== "") return chatId;
    return mintChatId();
  }, [chatId, mintChatId]);

  const threadKey = chatId !== "" ? chatId : scope.cohortKey ?? "";

  const {
    messages,
    sendMessage,
    setMessages,
    busy: asking,
    status: chatStatus,
    stop,
    authReady,
    error,
    clearError,
    addToolApprovalResponse,
  } = useAgentChat({ brandIds: scope.brandIds, cohortKey: scope.cohortKey ?? "", chatId });

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
    threadKey === "" ? "skip" : { threadKey },
  );
  const evidenceById = useMemo(() => {
    const map = new Map<string, EvidenceDetail>();
    for (const ref of ledgerRefs ?? []) map.set(ref.claimId, ref);
    for (const [id, claim] of claimsById) if (!map.has(id)) map.set(id, claim);
    return map;
  }, [ledgerRefs, claimsById]);

  const history = useQuery(
    api.messages.listRecent,
    threadKey === "" ? "skip" : { threadKey, limit: 50 },
  );
  const traceEvents = useAskTraceEvents(threadKey === "" ? null : threadKey);
  const persistedCardsByMessageId = useMemo(() => {
    if (history === undefined || traceEvents === undefined) return {};
    const cardsByTurn = toolCardsByAssistantTurn(traceEvents);
    const byMessageId: Record<string, ToolCallCardView[]> = {};
    history
      .filter((row) => row.role === "assistant")
      .forEach((row, turnIndex) => {
        const cards = cardsByTurn[turnIndex];
        if (cards !== undefined && cards.length > 0) byMessageId[row.id] = cards;
      });
    return byMessageId;
  }, [history, traceEvents]);
  const hydratedThreadRef = useRef<string | null>(null);
  useEffect(() => {
    if (history === undefined || traceEvents === undefined || claims === undefined) return;
    if (hydratedThreadRef.current === threadKey) return;
    hydratedThreadRef.current = threadKey;
    if (history.length === 0) return;
    setMessages(
      history.map((row) => {
        const textPart = { type: "text" as const, text: row.text };
        if (row.role !== "assistant" || row.citations.length === 0) {
          return { id: row.id, role: row.role, parts: [textPart] };
        }
        const citationSources: Record<string, { url: string; engine: string }> = {};
        const sourcesByUrl = new Map<string, { url: string; engine: string }>();
        for (const claimId of row.citations) {
          const claim = evidenceById.get(claimId);
          if (claim === undefined) continue;
          citationSources[claimId] = { url: claim.evidenceUrl, engine: claim.sourceEngine };
          sourcesByUrl.set(claim.evidenceUrl, { url: claim.evidenceUrl, engine: claim.sourceEngine });
        }
        if (Object.keys(citationSources).length === 0) {
          return { id: row.id, role: row.role, parts: [textPart] };
        }
        return {
          id: row.id,
          role: row.role,
          parts: [
            textPart,
            {
              type: "data-hydrated-citations" as const,
              data: { sources: [...sourcesByUrl.values()], citationSources },
            },
          ],
        };
      }),
    );
  }, [history, traceEvents, claims, evidenceById, threadKey, setMessages]);

  const [value, setValue] = useState("");
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const autoSubmitted = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastScopeRef = useRef<{ brandIds: Id<"brands">[]; cohortKey: string; chatId: string }>({
    brandIds: scope.brandIds,
    cohortKey: scope.cohortKey ?? "",
    chatId: "",
  });

  const [mentionedBrandIds, setMentionedBrandIds] = useState<Id<"brands">[]>([]);
  const [mentionSource, setMentionSource] = useState<"typed" | null>(null);
  const [mentionToken, setMentionToken] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mentionNotice, setMentionNotice] = useState<string | null>(null);

  const mentionBrands: MentionBrand[] = useMemo(
    () => (brands ?? []).map((brand) => ({ id: brand._id, name: brand.name })),
    [brands],
  );
  const visibleMentionBrands = useMemo(
    () => filterMentionBrands(mentionBrands, mentionToken),
    [mentionBrands, mentionToken],
  );
  const mentionMenuOpen = mentionSource !== null;
  const safeHighlightedIndex = Math.min(
    highlightedIndex,
    Math.max(visibleMentionBrands.length - 1, 0),
  );
  const listboxId = "ask-view-mentions";
  const activeMentionOption = visibleMentionBrands[safeHighlightedIndex];

  function closeMentionMenu() {
    setMentionSource(null);
    setMentionToken("");
    setHighlightedIndex(0);
  }

  function addMention(brand: MentionBrand) {
    if (mentionedBrandIds.includes(brand.id)) return;
    const { overflowed } = mergeAskBrandIds(scope.brandIds, [...mentionedBrandIds, brand.id]);
    if (overflowed) {
      setMentionNotice(
        `Only ${MAX_ASK_BRANDS} brands can be in context at once. Remove one before adding ${brand.name}.`,
      );
      return;
    }
    setMentionNotice(null);
    setMentionedBrandIds((prev) => [...prev, brand.id]);
  }

  function removeMention(brandId: Id<"brands">) {
    setMentionedBrandIds((prev) => prev.filter((id) => id !== brandId));
  }

  function selectMentionBrand(brand: MentionBrand) {
    if (mentionSource === "typed") {
      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? value.length;
      const before = value.slice(0, cursor);
      const match = MENTION_TOKEN_RE.exec(before);
      if (match !== null) {
        const insertion = `@${brand.name} `;
        const nextValue = value.slice(0, match.index) + insertion + value.slice(cursor);
        const nextCursor = match.index + insertion.length;
        setValue(nextValue);
        requestAnimationFrame(() => {
          textarea?.setSelectionRange(nextCursor, nextCursor);
        });
      }
    }
    addMention(brand);
    closeMentionMenu();
    textareaRef.current?.focus();
  }

  function handleValueChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    setValue(nextValue);
    const cursor = event.target.selectionStart ?? nextValue.length;
    const match = MENTION_TOKEN_RE.exec(nextValue.slice(0, cursor));
    if (match !== null) {
      setMentionSource("typed");
      setMentionToken(match[1]);
      setHighlightedIndex(0);
    } else if (mentionSource === "typed") {
      closeMentionMenu();
    }
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!mentionMenuOpen) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (visibleMentionBrands.length === 0) return;
      setHighlightedIndex((index) => (index + 1) % visibleMentionBrands.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (visibleMentionBrands.length === 0) return;
      setHighlightedIndex(
        (index) => (index - 1 + visibleMentionBrands.length) % visibleMentionBrands.length,
      );
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      const brand = visibleMentionBrands[safeHighlightedIndex];
      if (brand === undefined) return;
      event.preventDefault();
      selectMentionBrand(brand);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeMentionMenu();
      textareaRef.current?.focus();
    }
  }

  const submit = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed === "" || asking) return;
      const { merged, overflowed } = mergeAskBrandIds(scope.brandIds, mentionedBrandIds);
      if (overflowed) {
        setMentionNotice(`Only ${MAX_ASK_BRANDS} brands can be in context at once.`);
      }
      const cohortKeyForSend = scope.cohortKey ?? "";
      const chatIdForSend = ensureChatId();
      lastScopeRef.current = { brandIds: merged, cohortKey: cohortKeyForSend, chatId: chatIdForSend };
      setLastQuestion(trimmed);
      setValue("");
      setMentionedBrandIds([]);
      closeMentionMenu();
      clearError();
      await sendMessage(
        { text: trimmed },
        { body: { brandIds: merged, cohortKey: cohortKeyForSend, chatId: chatIdForSend } },
      );
    },
    [sendMessage, asking, scope, mentionedBrandIds, clearError, ensureChatId],
  );

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    if (!authReady) return;
    if (history === undefined || traceEvents === undefined) return;
    if (initialQuestion === null || initialQuestion.trim() === "") return;
    if (autoSubmitted.current === initialQuestion) return;
    autoSubmitted.current = initialQuestion;
    void submitRef.current(initialQuestion);
    return () => {
      autoSubmitted.current = null;
    };
  }, [authReady, history, traceEvents, initialQuestion]);

  async function respondToApproval(approvalId: string, approved: boolean) {
    const { brandIds, cohortKey: cohortKeyForSend } = lastScopeRef.current;
    await addToolApprovalResponse({
      id: approvalId,
      approved,
      options: {
        body: { brandIds, cohortKey: cohortKeyForSend, chatId: lastScopeRef.current.chatId },
      },
    });
  }

  const sourceRows = useMemo(
    () => sourceRowsOf(messages as unknown as { parts?: unknown }[], claimsById),
    [messages, claimsById],
  );
  const hasTranscript = messages.length > 0;
  const focusedEmptyState = useRef(false);
  useEffect(() => {
    if (focusedEmptyState.current) return;
    if (hasTranscript || history === undefined || history.length > 0) return;
    focusedEmptyState.current = true;
    textareaRef.current?.focus();
  }, [hasTranscript, history]);
  const draftLength = value.length;
  const overCap = draftLength > ASK_MAX_CHARS;
  const nearCap = draftLength >= ASK_MAX_CHARS * 0.9;
  const canSend = value.trim().length > 0 && !asking && !overCap;
  const isGenerating = chatStatus === "submitted" || chatStatus === "streaming";
  const mentionBrandViews = mentionedBrandIds
    .map((id) => mentionBrands.find((brand) => brand.id === id))
    .filter((brand): brand is MentionBrand => brand !== undefined);
  const composer = (
    <>
      {mentionBrandViews.length > 0 ? (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>Context</span>
          {mentionBrandViews.map((brand) => (
            <span
              key={String(brand.id)}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-border-strong bg-bg-inset px-2 text-[11.5px] text-fg-secondary"
            >
              {brand.name}
              <button
                type="button"
                aria-label={`Remove ${brand.name} from context`}
                onClick={() => removeMention(brand.id)}
                className="rounded-full p-0.5 text-fg-tertiary hover:bg-bg-raised-2 hover:text-fg"
              >
                <X aria-hidden className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        {mentionMenuOpen ? (
          <BrandMentionMenu
            id={listboxId}
            brands={visibleMentionBrands}
            highlightedIndex={safeHighlightedIndex}
            onSelect={selectMentionBrand}
          />
        ) : null}
        <PromptInput
          onSubmit={(message) => {
            void submit(message.text);
          }}
          className="rounded-[20px] border border-border/70 bg-bg-raised shadow-[var(--shadow-drawer),0_2px_0_rgba(255,255,255,0.6)_inset] transition-[box-shadow,border-color] duration-200 ease-out focus-within:border-accent/50 focus-within:shadow-[var(--shadow-drawer),0_1px_2px_rgba(16,24,40,0.08)]"
        >
          <PromptInputBody>
            <PromptInputTextarea
              ref={textareaRef}
              value={value}
              onChange={handleValueChange}
              onKeyDown={handleTextareaKeyDown}
              disabled={asking}
              placeholder="Which rival is leaning hardest on discount hooks?"
              aria-invalid={error !== undefined || undefined}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={mentionMenuOpen}
              aria-controls={mentionMenuOpen ? listboxId : undefined}
              aria-activedescendant={
                mentionMenuOpen && activeMentionOption !== undefined
                  ? mentionOptionId(listboxId, activeMentionOption.id)
                  : undefined
              }
              className="min-h-[76px] max-h-[300px] overflow-y-auto bg-transparent pt-3.5 pl-1 text-fg placeholder:text-fg-placeholder"
            />
          </PromptInputBody>
          {/* Bottom control row: one continuous card with the textarea above it
              (no divider line, no tinted well) -- Karax's composer reads as a
              single card, never two stacked panels. */}
          <PromptInputFooter className="items-center gap-x-2 rounded-b-[20px] border-t-0 pb-1">
            <PromptInputTools className="gap-2">
              <ComposerAttachButton disabled={asking} />
              {/* No brand-scope control here, on purpose: the agent picks the
                  brands from the message (docs/specs/agent-brand-scope.md 3.8).
                  Typing "@name" still adds one, because a typed name IS part of
                  the message. Do not add a manual scope picker back. */}
            </PromptInputTools>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  overCap ? "text-danger" : nearCap ? "text-warn" : "text-fg-tertiary",
                )}
              >
                {draftLength}/{ASK_MAX_CHARS}
              </span>
              <PromptInputSubmit
                status={chatStatus}
                onStop={() => {
                  void stop();
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
                disabled={isGenerating ? false : !canSend}
                aria-label={isGenerating ? "Stop" : "Send"}
                className={cn(
                  "size-8 rounded-full",
                  isGenerating || (value.trim().length > 0 && !overCap)
                    ? "bg-accent text-accent-ink hover:bg-accent-strong"
                    : "bg-bg-inset text-fg-tertiary",
                  "disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-fg-tertiary disabled:opacity-60",
                )}
              >
                {chatStatus === "submitted" ? (
                  <Spinner />
                ) : chatStatus === "streaming" ? (
                  <Square className="size-3.5" aria-hidden="true" />
                ) : chatStatus === "error" ? (
                  <CircleAlert className="size-4" aria-hidden="true" />
                ) : (
                  <ArrowUp className="size-4" aria-hidden="true" />
                )}
              </PromptInputSubmit>
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>

      {mentionNotice !== null ? (
        <p role="status" className="mt-1.5 text-right text-[11px] text-danger">
          {mentionNotice}
        </p>
      ) : null}

      {error !== undefined ? (
        <p role="alert" className="mt-2 flex items-start gap-2 text-[12.5px] leading-[1.5] text-danger">
          <CircleAlert {...iconProps} size={14} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {error.message}
            {lastQuestion !== null ? (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    void submit(lastQuestion);
                  }}
                  className="cursor-pointer underline decoration-danger underline-offset-[3px] hover:text-fg"
                >
                  Retry
                </button>
              </>
            ) : null}
          </span>
        </p>
      ) : null}
    </>
  );

  return (
    <SidebarProvider className="min-h-dvh" defaultOpen={true}>
      <Sidebar />
      <SidebarInset className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <SidebarTrigger aria-label="Toggle chat history" />
        <div className="flex min-w-0 items-center gap-3">
          {hasTranscript ? (
            <>
              {sourceRows.length > 0 ? <SourcesDrawer rows={sourceRows} /> : null}
              <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                Clear
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
            {!hasTranscript ? (
              <ConversationEmptyState className="flex-1">
                <div className="w-full max-w-2xl space-y-7 text-center">
                  <div className="mx-auto max-w-md space-y-5">
                    <motion.div
                      aria-hidden="true"
                      className="relative mx-auto flex size-24 items-center justify-center"
                      initial={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <span className="absolute inset-0 rounded-full bg-accent/60 blur-2xl" />
                      <span className="absolute inset-3 rounded-full bg-accent-strong/50 blur-lg" />
                      <span
                        className="relative flex size-14 items-center justify-center rounded-full text-[16px] font-semibold text-bg shadow-[inset_0_-6px_10px_rgba(0,0,0,0.28),inset_0_3px_4px_rgba(255,255,255,0.3),0_6px_14px_rgba(15,118,110,0.35)]"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 32% 28%, var(--accent-strong) 0%, var(--accent) 55%, #0b3b37 100%)",
                        }}
                      >
                        D
                      </span>
                    </motion.div>
                    <div className="space-y-2">
                      <h1 className="type-display text-fg">
                        {firstName !== null ? (
                          <>
                            <span className="font-normal text-fg-secondary">Good {greeting}, </span>
                            {firstName}
                          </>
                        ) : (
                          `Good ${greeting}.`
                        )}
                      </h1>
                      <p className="text-[15px] leading-6 text-fg-secondary">
                        Ask about your rivals — a comparison, a trend, or the evidence
                        behind any signal. Every useful sentence links back to a real
                        tool result.
                      </p>
                    </div>
                  </div>
                  <div className="w-full text-left">{composer}</div>
                  <PromptCategories
                    disabled={asking}
                    onSelect={(prompt) => {
                      setValue(prompt);
                      requestAnimationFrame(() => textareaRef.current?.focus());
                    }}
                  />
                </div>
              </ConversationEmptyState>
            ) : null}

            {messages.map((message, index) => {
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
                  isStreaming={isLastMessage && chatStatus === "streaming"}
                  isBusy={isLastMessage && isGenerating}
                  persistedCards={persistedCardsByMessageId[message.id]}
                  onRespondToApproval={(id, approved) => void respondToApproval(id, approved)}
                  onOpenCitation={setOpenClaimId}
                  onSelectFollowUp={(question) => void submit(question)}
                  onRetry={
                    precedingUserText !== null && !asking ? () => void submit(precedingUserText) : undefined
                  }
                />
              );
            })}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {hasTranscript ? (
          <motion.div
            className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 sm:px-6"
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
          >
            {composer}
          </motion.div>
        ) : null}
      </div>
      <CitationDrawer
        open={openClaimId !== null}
        claim={openClaimId !== null ? evidenceById.get(openClaimId) : undefined}
        onOpenChange={(open) => {
          if (!open) setOpenClaimId(null);
        }}
      />
      </SidebarInset>
    </SidebarProvider>
  );
}
