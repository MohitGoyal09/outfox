"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useQuery } from "convex/react";
import { Mic, Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const PILL_BUTTON_CLASS =
  "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out";

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
  const inputRef = useRef<HTMLInputElement>(null);

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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
              className="flex items-center gap-1 rounded-full border border-border bg-bg-raised px-1.5 py-1.5 transition-colors duration-150 ease-out focus-within:border-border-strong sm:gap-1.5 sm:px-2"
            >
              <button
                type="button"
                aria-label="Add a brand to this question"
                aria-pressed={mentionSource === "plus"}
                onClick={togglePlusMenu}
                className={cn(
                  PILL_BUTTON_CLASS,
                  "text-fg-tertiary hover:bg-bg-inset hover:text-fg-secondary",
                )}
              >
                <Paperclip aria-hidden className="size-[18px]" />
              </button>

              <label htmlFor="docked-ask" className="sr-only">
                Ask about these rivals
              </label>
              <input
                id="docked-ask"
                name="ask"
                ref={inputRef}
                value={value}
                onChange={handleValueChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => {
                  setFocused(true);
                  refreshScope();
                }}
                onBlur={() => setFocused(false)}
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
                className="min-w-0 flex-1 bg-transparent px-1 text-[14px] text-fg placeholder:text-fg-placeholder focus:outline-none"
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Voice input"
                      aria-disabled="true"
                      onClick={(event) => event.preventDefault()}
                      className={cn(
                        PILL_BUTTON_CLASS,
                        "text-fg-tertiary hover:bg-transparent",
                      )}
                    >
                      <Mic aria-hidden className="size-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Voice input isn&apos;t available yet
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button
                type="submit"
                disabled={!canSend}
                aria-label="Send"
                className={cn(
                  PILL_BUTTON_CLASS,
                  "bg-accent text-accent-ink hover:bg-accent-strong disabled:bg-bg-inset disabled:text-fg-tertiary",
                )}
              >
                <Send aria-hidden className="size-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
