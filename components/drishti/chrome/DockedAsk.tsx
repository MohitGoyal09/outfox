"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useQuery } from "convex/react";
import { Plus, ShieldCheck } from "lucide-react";
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
  mergeAskBrandIds,
  type AskScope,
} from "@/components/drishti/ask/ask-model";
import {
  BrandMentionMenu,
  filterMentionBrands,
  mentionOptionId,
  type MentionBrand,
} from "@/components/drishti/ask/BrandMentionMenu";
import { VALUE_CLASS } from "@/components/drishti/tokens";

const NO_SCOPE: AskScope = { cohortKey: null, brandIds: [], runId: null };
const MENTION_TOKEN_RE = /@([^\s@]*)$/;

export function DockedAsk() {
  const [scope, setScope] = useState<AskScope>(NO_SCOPE);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
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
  const canSend = value.trim().length > 0;
  const showScope = scopeCount > 0 && (focused || value !== "");

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

  function submit() {
    const question = value.trim();
    if (question === "") return;
    const pathScope = askScopeFromPath(
      window.location.pathname,
      window.location.search,
    );
    const { merged, overflowed } = mergeAskBrandIds(pathScope.brandIds, mentionedBrandIds);
    if (overflowed) {
      setMentionNotice(`Only ${MAX_ASK_BRANDS} brands can be in context at once.`);
    }
    const current: AskScope = { ...pathScope, brandIds: merged };
    setValue("");
    setMentionedBrandIds([]);
    closeMentionMenu();
    window.location.href = askHref(current, question);
  }

  const activeOption = visibleMentionBrands[safeHighlightedIndex];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
        <div className="flex flex-col gap-2">
          {showScope ? (
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
              onSubmit={submit}
              onFocus={() => {
                setFocused(true);
                refreshScope();
              }}
              onBlur={() => setFocused(false)}
              className="rounded-3xl border border-border-strong bg-white shadow-[0_12px_32px_rgba(16,24,40,0.14)] transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-accent focus-within:shadow-[0_16px_38px_rgba(16,24,40,0.18)]"
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
                  className="min-h-10 max-h-[200px] overflow-y-auto bg-transparent text-[14px] text-fg placeholder:text-fg-placeholder"
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
                    <ShieldCheck className="size-3.5 text-ok" /> Every answer cites a tool result
                  </span>
                </PromptInputTools>
                <PromptInputSubmit
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
