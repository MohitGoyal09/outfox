"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, ArrowUpRight, CircleAlert, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  askScopeFromPath,
  isLongAnswer,
  type AskScope,
} from "@/components/drishti/ask/ask-model";
import { useAskSubmit } from "@/components/drishti/ask/useAsk";
import { VALUE_CLASS, iconProps } from "@/components/drishti/tokens";

type Preview = {
  tone: "ok" | "warn" | "danger";
  text: string;
  href: string | null;
};

const NO_SCOPE: AskScope = { cohortKey: null, brandIds: [], runId: null };

function askHref(scope: AskScope): string {
  return scope.cohortKey !== null
    ? `/ask?cohort=${encodeURIComponent(scope.cohortKey)}`
    : "/ask";
}

export function DockedAsk() {
  const pathname = usePathname();
  const router = useRouter();
  const [scope, setScope] = useState<AskScope>(NO_SCOPE);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const { ask, asking, error, clearError } = useAskSubmit();

  const scopeCount = scope.brandIds.length;
  const canSend = value.trim().length > 0 && !asking;
  const showScope = scopeCount > 0 && (focused || value !== "");
  const onAskPage = pathname.startsWith("/ask");

  function refreshScope() {
    setScope(askScopeFromPath(window.location.pathname, window.location.search));
  }

  async function submit() {
    const question = value.trim();
    if (question === "" || asking) return;
    const current = askScopeFromPath(
      window.location.pathname,
      window.location.search,
    );
    setPreview(null);
    clearError();
    const exchange = await ask(question, current);
    if (exchange === null) return;
    setValue("");
    const result = exchange.result;
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
      setPreview({
        tone: "warn",
        text:
          result.message ??
          "No stored claims cover these brands yet. Run a refresh, then ask again.",
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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="pointer-events-auto mx-auto w-full max-w-[1440px] px-4 pb-4 sm:px-6">
        <div className="flex flex-col gap-2">
          {blockText !== null ? (
            <div
              aria-live="polite"
              className={cn(
                "ml-auto flex w-full max-w-2xl items-start gap-2 rounded-[10px] border bg-bg-raised-2 p-3 shadow-[var(--shadow-toast)]",
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

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            onFocus={() => {
              setFocused(true);
              refreshScope();
            }}
            onBlur={() => setFocused(false)}
            className="flex items-center gap-2 rounded-lg border border-border-strong bg-bg-raised-2 p-2 focus-within:border-accent"
          >
            <label htmlFor="docked-ask" className="sr-only">
              Ask about these rivals
            </label>
            <input
              id="docked-ask"
              name="ask"
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              disabled={asking}
              aria-invalid={error !== null ? true : undefined}
              placeholder="Ask about your rivals, or type @ to reference a brand."
              className="h-9 min-w-0 flex-1 rounded-[5px] bg-transparent px-2 text-[15px] text-fg outline-none placeholder:text-fg-placeholder disabled:cursor-not-allowed disabled:text-fg-tertiary aria-invalid:text-[var(--danger)]"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send"
              aria-busy={asking || undefined}
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-[5px] bg-accent text-accent-ink",
                canSend &&
                  "transition-colors duration-150 ease-out hover:bg-accent-strong active:translate-y-[0.5px]",
                "disabled:cursor-not-allowed disabled:bg-bg-raised disabled:text-fg-tertiary",
              )}
            >
              {asking ? (
                <Loader2
                  {...iconProps}
                  size={16}
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : (
                <ArrowUp {...iconProps} size={16} aria-hidden="true" className="size-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
