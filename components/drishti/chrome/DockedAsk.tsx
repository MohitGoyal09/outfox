"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowUpRight, CircleAlert, Plus, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  MAX_ASK_BRANDS,
  askHref,
  askScopeFromPath,
  askThreadKey,
  isLongAnswer,
  mergeAskBrandIds,
  type AskScope,
} from "@/components/drishti/ask/ask-model";
import {
  BrandMentionMenu,
  filterMentionBrands,
  mentionOptionId,
  type MentionBrand,
} from "@/components/drishti/ask/BrandMentionMenu";
import { useAskSubmit } from "@/components/drishti/ask/useAsk";
import { VALUE_CLASS, iconProps } from "@/components/drishti/tokens";

type Preview = {
  tone: "ok" | "warn" | "danger";
  text: string;
  href: string | null;
};

const NO_SCOPE: AskScope = { cohortKey: null, brandIds: [], runId: null };
const MENTION_TOKEN_RE = /@([^\s@]*)$/;

export function DockedAsk() {
  const pathname = usePathname();
  const router = useRouter();
  const [scope, setScope] = useState<AskScope>(NO_SCOPE);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const { ask, asking, error, clearError } = useAskSubmit();
  const trackedBrands = useQuery(api.brands.listBrands);

  const [mentionedBrandIds, setMentionedBrandIds] = useState<Id<"brands">[]>([]);
  const [mentionSource, setMentionSource] = useState<"typed" | "plus" | null>(null);
  const [mentionToken, setMentionToken] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mentionNotice, setMentionNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const scopeCount = scope.brandIds.length;
  const canSend = value.trim().length > 0 && !asking;
  const showScope = scopeCount > 0 && (focused || value !== "");
  const onAskPage = pathname.startsWith("/ask");

  function refreshScope() {
    setScope(askScopeFromPath(window.location.pathname, window.location.search));
  }

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

  function selectMentionBrand(brand: MentionBrand) {
    if (mentionSource === "typed") {
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
    }
    addMention(brand);
    closeMentionMenu();
    inputRef.current?.focus();
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

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
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
      inputRef.current?.focus();
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
    inputRef.current?.focus();
  }

  async function submit() {
    const question = value.trim();
    if (question === "" || asking) return;
    const pathScope = askScopeFromPath(
      window.location.pathname,
      window.location.search,
    );
    const { merged, overflowed } = mergeAskBrandIds(pathScope.brandIds, mentionedBrandIds);
    if (overflowed) {
      setMentionNotice(`Only ${MAX_ASK_BRANDS} brands can be in context at once.`);
    }
    const current: AskScope = { ...pathScope, brandIds: merged };
    setPreview(null);
    clearError();
    const result = await ask(question, current, askThreadKey(pathScope));
    if (result === null) return;
    setValue("");
    setMentionedBrandIds([]);
    closeMentionMenu();
    const href = askHref(current);
    if (result.available === false) {
      setPreview({
        tone: "danger",
        text:
          result.message ??
          "Ask needs a model key. No answer was generated.",
        href: null,
      });
      return;
    }
    if (result.mode === "empty") {
      const refreshFailed = result.liveRefresh?.error !== undefined;
      setPreview({
        tone: "warn",
        text: refreshFailed
          ? `A live refresh ran automatically and failed: ${result.liveRefresh?.error}`
          : result.liveRefresh?.attempted === true
            ? "A live refresh ran automatically and found nothing new for these brands."
            : (result.message ?? "No stored claims cover these brands yet."),
        href: null,
      });
      return;
    }
    if (result.mode === "error") {
      setPreview({
        tone: "danger",
        text: result.error ?? result.message ?? "Ask failed.",
        href: null,
      });
      return;
    }
    if (result.mode === "invalid" || result.answer.trim() === "") {
      setPreview({
        tone: "warn",
        text: "The stored claims do not answer that question.",
        href,
      });
      return;
    }
    if (isLongAnswer(result.answer)) {
      if (!onAskPage) router.push(href);
      return;
    }
    setPreview({ tone: "ok", text: result.answer, href });
  }

  const blockTone = error !== null ? "danger" : preview?.tone ?? "neutral";
  const blockText = error ?? preview?.text ?? null;
  const blockHref = error !== null ? null : (preview?.href ?? null);
  const activeOption = visibleMentionBrands[safeHighlightedIndex];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
        <div className="flex flex-col gap-2">
          {blockText !== null ? (
            <div
              aria-live="polite"
              className={cn(
                "mx-auto flex w-full items-start gap-2 rounded-xl border bg-bg-raised-2 p-3 shadow-[var(--shadow-toast)]",
                blockTone === "danger"
                  ? "border-[var(--danger)]"
                  : blockTone === "warn"
                    ? "border-border-strong"
                    : "border-border",
              )}
            >
              {blockTone === "danger" ? (
                <CircleAlert
                  {...iconProps}
                  size={14}
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-[var(--danger)]"
                />
              ) : null}
              <p
                className={cn(
                  "min-w-0 flex-1 text-[12.5px] leading-[1.5]",
                  blockTone === "danger"
                    ? "text-[var(--danger)]"
                    : blockTone === "warn"
                      ? "text-fg-secondary"
                      : "text-fg",
                )}
              >
                <span className="line-clamp-3">{blockText}</span>
                {blockHref !== null ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => router.push(blockHref)}
                      className="inline-flex cursor-pointer items-center gap-1 font-medium text-[var(--accent)] underline decoration-[var(--border-strong)] underline-offset-[3px] hover:decoration-[var(--accent)]"
                    >
                      Open in Ask
                      <ArrowUpRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
                    </button>
                  </>
                ) : null}
                {error !== null ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        void submit();
                      }}
                      className="cursor-pointer font-medium text-[var(--accent)] underline decoration-[var(--border-strong)] underline-offset-[3px] hover:decoration-[var(--accent)]"
                    >
                      Retry
                    </button>
                  </>
                ) : null}
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => {
                  setPreview(null);
                  clearError();
                }}
                className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[5px] text-fg-tertiary transition-colors duration-150 ease-out hover:bg-bg-raised hover:text-fg"
              >
                <X {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          ) : showScope ? (
            <p
              className={cn(
                VALUE_CLASS,
                "ml-auto w-full max-w-2xl px-1 text-right text-[10.5px] text-fg-tertiary",
              )}
            >
              {scopeCount} rival{scopeCount === 1 ? "" : "s"} in view
            </p>
          ) : null}

          {mentionNotice !== null ? (
            <p
              role="status"
              className={cn(
                VALUE_CLASS,
                "ml-auto w-full max-w-2xl px-1 text-right text-[10.5px] text-[var(--danger)]",
              )}
            >
              {mentionNotice}
            </p>
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
              onSubmit={() => {
                void submit();
              }}
              onFocus={() => {
                setFocused(true);
                refreshScope();
              }}
              onBlur={() => setFocused(false)}
              className="rounded-[10px] border border-border-strong bg-white shadow-[0_12px_32px_rgba(16,24,40,0.14)] transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-accent focus-within:shadow-[0_16px_38px_rgba(16,24,40,0.18)]"
            >
              <PromptInputBody>
                <label htmlFor="docked-ask" className="sr-only">
                  Ask about these rivals
                </label>
                <PromptInputTextarea
                  id="docked-ask"
                  name="ask"
                  ref={inputRef}
                  value={value}
                  onChange={handleValueChange}
                  onKeyDown={handleInputKeyDown}
                  autoComplete="off"
                  disabled={asking}
                  aria-invalid={error !== null ? true : undefined}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={mentionMenuOpen}
                  aria-controls={mentionMenuOpen ? listboxId : undefined}
                  aria-activedescendant={
                    mentionMenuOpen && activeOption !== undefined
                      ? mentionOptionId(listboxId, activeOption.id)
                      : undefined
                  }
                  placeholder="Ask about your rivals, or type @ to reference a brand."
                  className="min-h-10 bg-transparent text-[14px] text-fg placeholder:text-fg-placeholder aria-invalid:text-[var(--danger)]"
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputButton
                    aria-label="Add a brand to this question"
                    aria-pressed={mentionSource === "plus"}
                    onClick={togglePlusMenu}
                  >
                    <Plus aria-hidden className="size-4" />
                  </PromptInputButton>
                  <span className="hidden items-center gap-1.5 text-xs text-fg-tertiary sm:flex">
                    <ShieldCheck className="size-3.5 text-ok" /> Answers cite stored claims only
                  </span>
                </PromptInputTools>
                <PromptInputSubmit
                  status={asking ? "submitted" : undefined}
                  disabled={!canSend}
                  aria-label="Send"
                  className="rounded-full bg-accent text-accent-ink hover:bg-accent-strong disabled:bg-bg-inset disabled:text-fg-tertiary"
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
