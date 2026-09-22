"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { CircleAlert, Database, Plus, ShieldCheck, X } from "lucide-react";
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
} from "@/components/ai-elements/prompt-input";
import { Button } from "../Button";
import { Skeleton } from "../Skeleton";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { AskMessage } from "./AskMessage";
import { AskReasoning } from "./AskReasoning";
import {
  BrandMentionMenu,
  filterMentionBrands,
  mentionOptionId,
  type MentionBrand,
} from "./BrandMentionMenu";
import {
  MAX_ASK_BRANDS,
  askScopeLabel,
  askThreadKey,
  brandIdsFromCohortKey,
  buildAskTurns,
  buildClaimIndex,
  buildTagIndex,
  citedSnapshotIds,
  mergeAskBrandIds,
  type AskClaimView,
  type AskScope,
  type AskTagView,
} from "./ask-model";
import { useAskSubmit } from "./useAsk";

const SUGGESTIONS = [
  "Which rival leans into discount hooks the most?",
  "What changed since the last run?",
  "Show the evidence behind the top hook.",
];

const EMPTY_INDEX = new Map<string, AskClaimView>();
const EMPTY_TAG_INDEX = new Map<string, AskTagView>();
const EMPTY_SNAPSHOT_INDEX = new Map<string, Doc<"snapshots">>();
const EMPTY_MESSAGES: never[] = [];
const EMPTY_EVENTS: never[] = [];

const MENTION_TOKEN_RE = /@([^\s@]*)$/;

const SHELL_HEADER_PX = 114;

export function AskView({
  cohortKey,
  initialQuestion,
  initialBrandIds = [],
}: {
  cohortKey: string | null;
  initialQuestion: string | null;
  initialBrandIds?: Id<"brands">[];
}) {
  const brands = useQuery(api.brands.listBrands);
  const isBrandsMode = cohortKey === null && initialBrandIds.length > 0;
  const run = useQuery(
    api.runs.latestForCohort,
    cohortKey !== null ? { cohortKey } : "skip",
  );
  const runId = run?._id ?? null;
  const cohortClaims = useQuery(
    api.claims.byRun,
    !isBrandsMode && runId !== null ? { runId } : "skip",
  );
  const brandsClaims = useQuery(
    api.claims.byBrands,
    isBrandsMode ? { brandIds: initialBrandIds } : "skip",
  );
  const runClaims = isBrandsMode ? brandsClaims : cohortClaims;

  const brandNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brands ?? []) map[String(brand._id)] = brand.name;
    return map;
  }, [brands]);

  const claimIndex = useMemo(
    () => (runClaims !== undefined ? buildClaimIndex(runClaims, brandNames) : EMPTY_INDEX),
    [runClaims, brandNames],
  );

  const tagIndex = useMemo(
    () => (runClaims !== undefined ? buildTagIndex(runClaims) : EMPTY_TAG_INDEX),
    [runClaims],
  );

  const scope: AskScope = useMemo(() => {
    if (isBrandsMode) {
      return { cohortKey: null, brandIds: initialBrandIds, runId: null };
    }
    return {
      cohortKey,
      brandIds: brandIdsFromCohortKey(cohortKey),
      runId,
    };
  }, [isBrandsMode, initialBrandIds, cohortKey, runId]);

  const threadKey = askThreadKey(scope);
  const recentMessages = useQuery(api.messages.listRecent, { threadKey, limit: 50 });
  const recentEvents = useQuery(api.agentEvents.listEvents, { threadKey, limit: 200 });
  const clearMyThread = useMutation(api.messages.clearMyThread);
  const clearMyEvents = useMutation(api.agentEvents.clearMyEvents);

  const { turns, liveEvents } = useMemo(
    () => buildAskTurns(recentMessages ?? EMPTY_MESSAGES, recentEvents ?? EMPTY_EVENTS),
    [recentMessages, recentEvents],
  );

  const [focusedCitation, setFocusedCitation] = useState<{ turnId: string; citationId: string } | null>(
    null,
  );
  const focusCitation = useCallback((turnId: string, citationId: string) => {
    setFocusedCitation((current) =>
      current?.turnId === turnId && current.citationId === citationId
        ? null
        : { turnId, citationId },
    );
  }, []);
  useEffect(() => {
    if (focusedCitation === null) return;
    const element = document.getElementById(
      `citation-${focusedCitation.turnId}-${focusedCitation.citationId}`,
    );
    element?.scrollIntoView({ block: "nearest" });
  }, [focusedCitation]);

  const snapshotIds = useMemo(
    () => citedSnapshotIds(turns, claimIndex),
    [turns, claimIndex],
  );
  const citedSnapshots = useQuery(
    api.snapshots.byIds,
    snapshotIds.length > 0 ? { snapshotIds } : "skip",
  );
  const snapshotIndex = useMemo(() => {
    if (citedSnapshots === undefined) return EMPTY_SNAPSHOT_INDEX;
    const map = new Map<string, Doc<"snapshots">>();
    for (const snapshot of citedSnapshots) map.set(String(snapshot._id), snapshot);
    return map;
  }, [citedSnapshots]);

  const { ask, asking, error } = useAskSubmit();
  const [value, setValue] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const autoSubmitted = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [mentionedBrandIds, setMentionedBrandIds] = useState<Id<"brands">[]>([]);
  const [mentionSource, setMentionSource] = useState<"typed" | "plus" | null>(null);
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

  function togglePlusMenu() {
    if (mentionSource === "plus") {
      closeMentionMenu();
      return;
    }
    setMentionSource("plus");
    setMentionToken("");
    setHighlightedIndex(0);
    textareaRef.current?.focus();
  }

  const submit = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed === "" || asking) return;
      const { merged, overflowed } = mergeAskBrandIds(scope.brandIds, mentionedBrandIds);
      if (merged.length === 0) {
        setMentionNotice("Select a brand first — type @ to reference one, or open a cohort.");
        return;
      }
      if (overflowed) {
        setMentionNotice(`Only ${MAX_ASK_BRANDS} brands can be in context at once.`);
      }
      const current: AskScope = { ...scope, brandIds: merged };
      setPendingQuestion(trimmed);
      setLastQuestion(trimmed);
      setValue("");
      const result = await ask(trimmed, current, threadKey);
      setPendingQuestion(null);
      if (result === null) {
        setValue(trimmed);
        return;
      }
      setMentionedBrandIds([]);
      closeMentionMenu();
    },
    [ask, asking, scope, mentionedBrandIds, threadKey],
  );

  useEffect(() => {
    if (initialQuestion === null || initialQuestion.trim() === "") return;
    if (autoSubmitted.current === initialQuestion) return;
    autoSubmitted.current = initialQuestion;
    void submit(initialQuestion);
  }, [initialQuestion, submit]);

  const hasTranscript = turns.length > 0;
  const scopeText = askScopeLabel(scope, brandNames);
  const canSend = value.trim().length > 0 && !asking;
  const mentionBrandViews = mentionedBrandIds
    .map((id) => mentionBrands.find((brand) => brand.id === id))
    .filter((brand): brand is MentionBrand => brand !== undefined);

  return (
    <div
      className="-mx-5 -mt-8 -mb-28 flex flex-col sm:-mx-7 lg:-mx-8 lg:-mt-10"
      style={{ height: `calc(100dvh - ${SHELL_HEADER_PX}px)` }}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-7 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <ShieldCheck aria-hidden className="size-4 shrink-0 text-accent" />
          <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-fg">
            Ask Drishti
          </h1>
          <span className={cn(LABEL_CLASS, "hidden text-fg-tertiary sm:inline")}>
            Grounded research
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden max-w-[32ch] truncate text-xs text-fg-secondary md:inline">
            {scopeText}
          </span>
          {hasTranscript ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void clearMyThread({ threadKey });
                void clearMyEvents({ threadKey });
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-5 px-5 py-4 sm:px-7 lg:px-8">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent>
              {!hasTranscript && pendingQuestion === null ? (
                <ConversationEmptyState>
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm text-fg">Start with a question</h3>
                    <p className="max-w-[48ch] text-sm text-fg-secondary">
                      Ask a specific comparison or what changed. Drishti shows the
                      source trail alongside the answer.
                    </p>
                  </div>
                  <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-3">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={asking}
                        onClick={() => void submit(suggestion)}
                        className="rounded-[8px] border border-border bg-bg-raised px-3 py-3 text-left text-sm leading-5 text-fg-secondary transition-[border-color,background-color,color] duration-150 ease-out hover:border-accent/50 hover:bg-accent-dim hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </ConversationEmptyState>
              ) : null}

              {turns.map((turn) => (
                <AskMessage
                  key={turn.id}
                  turn={turn}
                  claimIndex={claimIndex}
                  snapshotIndex={snapshotIndex}
                  tagIndex={tagIndex}
                  onRetry={(question) => {
                    void submit(question);
                  }}
                  retrying={asking}
                  focusedCitationId={focusedCitation?.turnId === turn.id ? focusedCitation.citationId : null}
                  onFocusCitation={focusCitation}
                />
              ))}

              {pendingQuestion !== null ? (
                <div className="flex flex-col gap-3" aria-busy="true">
                  <p className="ml-auto w-fit max-w-[85%] rounded-[8px] bg-bg-inset px-4 py-3 text-sm text-fg">
                    {pendingQuestion}
                  </p>
                  {liveEvents.length > 0 ? (
                    <AskReasoning events={liveEvents} defaultOpen />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Skeleton variant="text" width="40%" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>answer</span>
                    <Skeleton variant="text" width="92%" />
                    <Skeleton variant="text" width="84%" />
                    <Skeleton variant="text" width="60%" />
                    <span className={cn(VALUE_CLASS, "text-[10.5px] text-fg-tertiary")}>
                      reading stored claims
                    </span>
                  </div>
                </div>
              ) : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="shrink-0 border-t border-border pt-3">
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
                className="rounded-3xl border border-border-strong bg-bg-raised transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]"
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleValueChange}
                    onKeyDown={handleTextareaKeyDown}
                    disabled={asking}
                    placeholder="Which rival is leaning hardest on discount hooks?"
                    aria-invalid={error !== null || undefined}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={mentionMenuOpen}
                    aria-controls={mentionMenuOpen ? listboxId : undefined}
                    aria-activedescendant={
                      mentionMenuOpen && activeMentionOption !== undefined
                        ? mentionOptionId(listboxId, activeMentionOption.id)
                        : undefined
                    }
                    className="bg-transparent text-fg placeholder:text-fg-placeholder"
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputButton
                      aria-label="Add a brand to this question"
                      aria-pressed={mentionSource === "plus"}
                      onClick={togglePlusMenu}
                    >
                      <Plus className="size-4" />
                    </PromptInputButton>
                    <span className="hidden items-center gap-1.5 text-xs text-fg-tertiary sm:flex">
                      <ShieldCheck className="size-3.5 text-ok" /> Answers cite stored claims only
                    </span>
                  </PromptInputTools>
                  <PromptInputSubmit
                    status={asking ? "submitted" : undefined}
                    disabled={!canSend}
                    className="rounded-full bg-accent text-accent-ink hover:bg-accent-strong disabled:bg-bg-inset disabled:text-fg-tertiary"
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>

            {mentionNotice !== null ? (
              <p role="status" className="mt-1.5 text-right text-[11px] text-[var(--danger)]">
                {mentionNotice}
              </p>
            ) : null}

            {error !== null ? (
              <p
                role="alert"
                className="mt-2 flex items-start gap-2 text-[12.5px] leading-[1.5] text-[var(--danger)]"
              >
                <CircleAlert {...iconProps} size={14} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {error}
                  {lastQuestion !== null ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => {
                          void submit(lastQuestion);
                        }}
                        className="cursor-pointer underline decoration-[var(--danger)] underline-offset-[3px] hover:text-fg"
                      >
                        Retry
                      </button>
                    </>
                  ) : null}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <aside className="hidden w-[240px] shrink-0 flex-col gap-3 overflow-y-auto lg:flex">
          <div className="rounded-[10px] border border-border bg-bg-raised p-3.5">
            <h2 className="text-[13px] font-semibold text-fg">How Ask works</h2>
            <p className="mt-2 text-xs leading-5 text-fg-secondary">
              Questions are matched to the latest stored claims for the brands in view.
            </p>
            <p className="mt-2 text-xs leading-5 text-fg-secondary">
              Every useful sentence links back to an evidence record. Missing data stays visible.
            </p>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs font-medium text-fg">
              <Database className="size-3.5 shrink-0 text-accent" />
              <span className="truncate">{scopeText}</span>
            </div>
          </div>
          <div className="rounded-[10px] border border-border bg-bg-inset p-3.5">
            <p className="text-xs leading-5 text-fg-secondary">
              When stored claims can&apos;t answer a question, Ask fetches live evidence
              automatically and shows it in the reasoning trail — no manual refresh needed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
