"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { ArrowUp, ChevronUp, CircleAlert, Plus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { AgentMessage } from "@/components/drishti/ask/AgentMessage";
import { CitationDrawer, type EvidenceDetail } from "@/components/drishti/ask/CitationDrawer";
import { MAX_ASK_BRANDS } from "@/components/drishti/ask/ask-model";
import { precedingUserTextOf } from "@/components/drishti/ask/agentChat-model";
import { useAgentChat } from "@/components/drishti/ask/useAgentChat";
import {
  BrandMentionMenu,
  filterMentionBrands,
  mentionOptionId,
  type MentionBrand,
} from "@/components/drishti/ask/BrandMentionMenu";
import { DockedAskPanel } from "@/components/drishti/chrome/DockedAskPanel";
import {
  canSubmitAsk,
  isChatRoute,
  pageBrandIdFromPath,
  scopeChipLabel,
  turnCount,
} from "@/components/drishti/chrome/dock-model";

const MENTION_TOKEN_RE = /@([^\s@]*)$/;
const NO_BRAND_IDS: string[] = [];

const mintChatId = () => `chat-${crypto.randomUUID()}`;

const SHELL =
  "pointer-events-auto flex flex-col items-stretch gap-1 border border-border bg-bg-raised shadow-[var(--shadow-lg)] " +
  "motion-safe:transition-[max-width,border-radius] motion-safe:duration-300 motion-safe:ease-out";

export function DockedAsk() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const chatIdRef = useRef<string | null>(null);
  const [dismissedForPath, setDismissedForPath] = useState<string | null>(null);
  const [openCitation, setOpenCitation] = useState<{ claimId: string; question: string | null } | null>(null);
  const trackedBrands = useQuery(api.brands.listBrands);

  const [mentionSource, setMentionSource] = useState<"typed" | null>(null);
  const [mentionToken, setMentionToken] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    sendMessage,
    setMessages,
    busy,
    status,
    stop,
    authReady,
    error,
    clearError,
    addToolApprovalResponse,
  } = useAgentChat({ brandIds: NO_BRAND_IDS, cohortKey: "" });

  const brandNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of trackedBrands ?? []) map[String(brand._id)] = brand.name;
    return map;
  }, [trackedBrands]);
  const claimBrandIds = useMemo(
    () => (trackedBrands ?? []).map((brand) => brand._id).slice(0, MAX_ASK_BRANDS),
    [trackedBrands],
  );
  const claims = useQuery(api.claims.byBrands, { brandIds: claimBrandIds });
  const claimsById = useMemo(() => {
    const map = new Map<string, Doc<"claims">>();
    for (const claim of claims ?? []) map.set(String(claim._id), claim);
    return map;
  }, [claims]);
  const ledgerRefs = useQuery(
    api.threadLedger.listForThread,
    chatId === null ? "skip" : { threadKey: chatId },
  );
  const evidenceById = useMemo(() => {
    const map = new Map<string, EvidenceDetail>();
    for (const ref of ledgerRefs ?? []) map.set(ref.claimId, ref);
    for (const [id, claim] of claimsById) if (!map.has(id)) map.set(id, claim);
    return map;
  }, [ledgerRefs, claimsById]);

  const mentionBrands: MentionBrand[] = useMemo(
    () => (trackedBrands ?? []).map((brand) => ({ id: brand._id, name: brand.name })),
    [trackedBrands],
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
  const listboxId = "docked-ask-mentions";

  const pageBrandId = pageBrandIdFromPath(pathname);
  const pageBrandName =
    pageBrandId !== null ? trackedBrands?.find((brand) => String(brand._id) === pageBrandId)?.name : undefined;
  const chipLabel = dismissedForPath === pathname ? null : scopeChipLabel(pageBrandName);
  const activePageBrandId = chipLabel !== null ? pageBrandId : null;

  const hasConversation = chatId !== null;
  const turns = turnCount(messages);
  const isGenerating = status === "submitted" || status === "streaming";
  const canSend = canSubmitAsk(value) && authReady && !busy;

  const lastBodyRef = useRef<Record<string, unknown>>({ brandIds: [], cohortKey: "", chatId: "" });

  const submit = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed === "" || busy) return;
      const id = chatIdRef.current ?? mintChatId();
      chatIdRef.current = id;
      setChatId(id);
      const requestBody = {
        brandIds: [],
        cohortKey: "",
        chatId: id,
        ...(activePageBrandId !== null ? { pageBrand: { brandId: activePageBrandId } } : {}),
      };
      lastBodyRef.current = requestBody;
      setPanelOpen(true);
      clearError();
      await sendMessage({ text: trimmed }, { body: requestBody });
    },
    [busy, activePageBrandId, clearError, sendMessage],
  );

  function collapsePanel() {
    setPanelOpen(false);
  }

  function clearConversation() {
    void stop();
    setMessages([]);
    clearError();
    chatIdRef.current = null;
    setChatId(null);
    setOpenCitation(null);
    setPanelOpen(false);
  }

  if (isChatRoute(pathname)) return null;

  function closeMentionMenu() {
    setMentionSource(null);
    setMentionToken("");
    setHighlightedIndex(0);
  }

  function selectMentionBrand(brand: MentionBrand) {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = MENTION_TOKEN_RE.exec(before);
    if (match !== null) {
      const insertion = `@${brand.name} `;
      const nextValue = value.slice(0, match.index) + insertion + value.slice(cursor);
      const nextCursor = match.index + insertion.length;
      setValue(nextValue);
      requestAnimationFrame(() => {
        input?.setSelectionRange(nextCursor, nextCursor);
      });
    }
    closeMentionMenu();
    inputRef.current?.focus();
  }

  function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
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

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (mentionMenuOpen) {
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
        inputRef.current?.focus();
        return;
      }
    }
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (panelOpen) {
      collapsePanel();
      return;
    }
    setExpanded(false);
    setValue("");
  }

  function handleSubmit() {
    if (!canSend) return;
    const question = value.trim();
    setValue("");
    closeMentionMenu();
    void submit(question);
  }

  async function respondToApproval(approvalId: string, approved: boolean) {
    await addToolApprovalResponse({ id: approvalId, approved, options: { body: lastBodyRef.current } });
  }

  const activeOption = visibleMentionBrands[safeHighlightedIndex];
  const wide = expanded || panelOpen;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex flex-col items-center px-4">
      {/* One width for panel and pill so their edges land on the same pixels. It follows the
          PANEL, not just input focus: submitting collapses the input, and the answer needs room. */}
      <div className={cn("flex w-full flex-col", wide ? "max-w-3xl" : "max-w-sm")}>
        <AnimatePresence>
          {panelOpen ? (
            <DockedAskPanel
              chatId={chatId}
              scrollKey={messages}
              onCollapse={collapsePanel}
              onClear={clearConversation}
            >
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
                    isStreaming={isLastMessage && status === "streaming"}
                    isBusy={isLastMessage && isGenerating}
                    question={precedingUserText}
                    threadKey={chatId ?? ""}
                    onRespondToApproval={(id, approved) => void respondToApproval(id, approved)}
                    onOpenCitation={(claimId) => setOpenCitation({ claimId, question: precedingUserText })}
                    onSelectFollowUp={(question) => void submit(question)}
                    onRetry={
                      precedingUserText !== null && !busy ? () => void submit(precedingUserText) : undefined
                    }
                  />
                );
              })}
              {error !== undefined ? (
                <p role="alert" className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-danger">
                  <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  <span>{error.message}</span>
                </p>
              ) : null}
            </DockedAskPanel>
          ) : null}
        </AnimatePresence>

        <div className="relative">
          {mentionMenuOpen && expanded ? (
            <BrandMentionMenu
              id={listboxId}
              brands={visibleMentionBrands}
              highlightedIndex={safeHighlightedIndex}
              onSelect={selectMentionBrand}
            />
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
            className={cn(SHELL, "w-full p-2 pl-3", panelOpen ? "rounded-b-3xl rounded-t-none" : "rounded-3xl")}
          >
            {chipLabel !== null ? (
              <div className="flex flex-wrap gap-1.5 px-1">
                <PageChip label={chipLabel} onRemove={() => setDismissedForPath(pathname)} />
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full text-fg-secondary"
                aria-hidden="true"
              >
                <Plus className="size-5" strokeWidth={1.75} />
              </span>

              {expanded ? (
                <input
                  autoFocus
                  ref={inputRef}
                  value={value}
                  onChange={handleValueChange}
                  onKeyDown={handleInputKeyDown}
                  onBlur={() => {
                    if (!canSubmitAsk(value)) setExpanded(false);
                  }}
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={mentionMenuOpen}
                  aria-controls={mentionMenuOpen ? listboxId : undefined}
                  aria-activedescendant={
                    mentionMenuOpen && activeOption !== undefined
                      ? mentionOptionId(listboxId, activeOption.id)
                      : undefined
                  }
                  placeholder="Ask Drishti"
                  aria-label="Ask a question about your tracked brands"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-fg placeholder:text-fg-placeholder focus-visible:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  onFocus={() => setExpanded(true)}
                  className="min-w-0 flex-1 cursor-text text-left text-[15px] text-fg-secondary focus-visible:outline-none"
                >
                  Ask Drishti
                </button>
              )}

              {/* Reopen: only once a conversation exists and the panel is folded away. The
                  badge is the number of questions asked, never a fabricated "new" dot. */}
              {!panelOpen && hasConversation ? (
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  aria-label={`Reopen conversation${turns > 0 ? ` (${turns} turn${turns === 1 ? "" : "s"})` : ""}`}
                  title="Reopen conversation"
                  className="relative grid size-8 shrink-0 place-items-center rounded-full text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <ChevronUp className="size-4" aria-hidden="true" />
                  {turns > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-accent text-[9px] font-medium leading-none text-accent-ink">
                      {turns}
                    </span>
                  ) : null}
                </button>
              ) : null}

              <button
                type={busy ? "button" : "submit"}
                onClick={busy ? () => void stop() : undefined}
                disabled={!busy && !canSend}
                aria-label={busy ? "Stop generating" : "Send"}
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-full",
                  "motion-safe:transition-colors motion-safe:duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  busy || canSend
                    ? "bg-accent text-accent-ink hover:bg-accent-strong"
                    : "cursor-not-allowed bg-bg-inset text-fg-tertiary",
                )}
              >
                {busy ? (
                  <Square className="size-3.5" aria-hidden="true" />
                ) : (
                  <ArrowUp className="size-5" strokeWidth={2} aria-hidden="true" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CitationDrawer
        open={openCitation !== null}
        claim={openCitation !== null ? evidenceById.get(openCitation.claimId) : undefined}
        claimId={(openCitation?.claimId ?? null) as Id<"claims"> | null}
        isStoredClaim={openCitation !== null && claimsById.has(openCitation.claimId)}
        question={openCitation?.question ?? null}
        threadKey={chatId ?? ""}
        onOpenChange={(open) => {
          if (!open) setOpenCitation(null);
        }}
      />
    </div>
  );
}

function PageChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-bg-inset pl-2.5 pr-1 text-xs text-fg-secondary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} context`}
        title={`Remove ${label} context`}
        className="flex size-4 items-center justify-center rounded-full text-fg-tertiary transition-colors hover:bg-bg-raised hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </span>
  );
}
