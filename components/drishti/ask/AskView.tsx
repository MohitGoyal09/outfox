"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQuery } from "convex/react";
import { ArrowUp, CircleAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Button } from "../Button";
import { Skeleton } from "../Skeleton";
import { TrailSkeleton } from "../Trail";
import {
  FOCUS_RING_CLASS,
  LABEL_CLASS,
  PRESS_CLASS,
  STATE_TRANSITION_CLASS,
  VALUE_CLASS,
  iconProps,
} from "../tokens";
import { AskTranscript } from "./AskTranscript";
import {
  askScopeLabel,
  brandIdsFromCohortKey,
  buildClaimIndex,
  type AskClaimView,
  type AskScope,
} from "./ask-model";
import {
  getAskExchanges,
  resetAskExchanges,
  subscribeAskExchanges,
} from "./ask-store";
import { useAskSubmit } from "./useAsk";

const SUGGESTIONS = [
  "Which rival leans into discount hooks the most?",
  "What changed since the last run?",
  "Show the evidence behind the top hook.",
];

const EMPTY_INDEX = new Map<string, AskClaimView>();

export function AskView({
  cohortKey,
  initialQuestion,
}: {
  cohortKey: string | null;
  initialQuestion: string | null;
}) {
  const brands = useQuery(api.brands.listBrands);
  const run = useQuery(
    api.runs.latestForCohort,
    cohortKey !== null ? { cohortKey } : "skip",
  );
  const runId = run?._id ?? null;
  const runClaims = useQuery(api.claims.byRun, runId !== null ? { runId } : "skip");

  const brandNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brands ?? []) map[String(brand._id)] = brand.name;
    return map;
  }, [brands]);

  const claimIndex = useMemo(
    () => (runClaims !== undefined ? buildClaimIndex(runClaims, brandNames) : EMPTY_INDEX),
    [runClaims, brandNames],
  );

  const scope: AskScope = useMemo(
    () => ({
      cohortKey,
      brandIds: brandIdsFromCohortKey(cohortKey),
      runId,
    }),
    [cohortKey, runId],
  );

  const exchanges = useSyncExternalStore(
    subscribeAskExchanges,
    getAskExchanges,
    getAskExchanges,
  );
  const { ask, asking, error } = useAskSubmit();
  const [value, setValue] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const autoSubmitted = useRef<string | null>(null);

  const submit = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed === "" || asking) return;
      setPendingQuestion(trimmed);
      setLastQuestion(trimmed);
      setValue("");
      const exchange = await ask(trimmed, scope);
      setPendingQuestion(null);
      if (exchange === null) setValue(trimmed);
    },
    [ask, asking, scope],
  );

  useEffect(() => {
    if (initialQuestion === null || initialQuestion.trim() === "") return;
    if (autoSubmitted.current === initialQuestion) return;
    autoSubmitted.current = initialQuestion;
    void submit(initialQuestion);
  }, [initialQuestion, submit]);

  const hasTranscript = exchanges.length > 0;
  const scopeText = askScopeLabel(scope, brandNames);
  const canSend = value.trim().length > 0 && !asking;

  return (
    <div className="flex flex-col gap-8">
      <header
        className={cn(
          "flex flex-col gap-4 border-b border-[var(--border)] pb-8",
          hasTranscript ? "items-start" : "items-center pt-12 text-center sm:pt-20",
        )}
      >
        <p className="type-label text-[var(--accent)]">Grounded research</p>
        <h1 className="type-display text-balance text-[var(--text-primary)]">
          Ask about your rivals
        </h1>
        <p
          className={cn(
            "text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]",
            hasTranscript ? "max-w-[68ch]" : "max-w-[52ch]",
          )}
        >
          {scopeText}
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(value);
          }}
          className="w-full max-w-2xl"
        >
          <div className="flex items-center gap-2 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-raised)] p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] focus-within:border-[var(--accent)]">
            <label htmlFor="ask-question" className="sr-only">
              Ask a question about the rivals in view
            </label>
            <input
              id="ask-question"
              name="question"
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              disabled={asking}
              aria-invalid={error !== null || undefined}
              placeholder="Which rival leans into discount hooks the most?"
              className={cn(
                "h-10 min-w-0 flex-1 bg-transparent px-2.5 text-[15px] text-[var(--text-primary,#eeeef2)] outline-none placeholder:text-[var(--text-placeholder,#7c7c88)] disabled:cursor-not-allowed disabled:text-[var(--text-tertiary,#64646f)]",
              )}
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Ask"
              aria-busy={asking || undefined}
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-[5px] bg-[var(--accent,#e2a339)] text-[var(--accent-ink,#1a1204)]",
                "hover:bg-[var(--accent-strong,#f0b552)]",
                canSend && PRESS_CLASS,
                canSend && STATE_TRANSITION_CLASS,
                "disabled:cursor-not-allowed disabled:bg-[var(--bg-raised,#131319)] disabled:text-[var(--text-tertiary,#64646f)] disabled:shadow-none",
                FOCUS_RING_CLASS,
              )}
            >
              <ArrowUp {...iconProps} size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        {!hasTranscript ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
              suggested
            </span>
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="ghost"
                size="sm"
                disabled={asking}
                className="max-w-full whitespace-normal"
                onClick={() => {
                  void submit(suggestion);
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        ) : null}
      </header>

      {error !== null ? (
        <p
          role="alert"
          className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-[var(--danger,#f87171)]"
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
                  className="cursor-pointer underline decoration-[var(--danger,#f87171)] underline-offset-[3px] hover:text-[var(--text-primary,#eeeef2)]"
                >
                  Retry
                </button>
              </>
            ) : null}
          </span>
        </p>
      ) : null}

      {pendingQuestion !== null ? (
        <section className="flex flex-col gap-4" aria-busy="true">
          <h2 className="type-headline max-w-[68ch] text-balance text-[var(--text-primary,#eeeef2)]">
            {pendingQuestion}
          </h2>
          <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
            tool trace
          </span>
          <TrailSkeleton density="vertical" stepCount={3} />
          <span className={cn(LABEL_CLASS, "mt-2 text-[var(--text-tertiary,#64646f)]")}>
            answer
          </span>
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" width="92%" />
            <Skeleton variant="text" width="84%" />
            <Skeleton variant="text" width="60%" />
          </div>
          <span className={cn(VALUE_CLASS, "text-[10.5px] text-[var(--text-tertiary,#64646f)]")}>
            reading stored claims
          </span>
        </section>
      ) : null}

      {hasTranscript ? (
        <section className="flex flex-col gap-6" aria-label="Ask transcript">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
              transcript
            </span>
            <Button variant="ghost" size="sm" onClick={resetAskExchanges}>
              Clear transcript
            </Button>
          </div>
          {exchanges.map((exchange) => (
            <AskTranscript
              key={exchange.id}
              exchange={exchange}
              claimIndex={claimIndex}
              onRetry={(question) => {
                void submit(question);
              }}
              retrying={asking}
            />
          ))}
        </section>
      ) : null}

      {!hasTranscript && pendingQuestion === null ? (
        <p className="flex items-center justify-center gap-2 text-[12px] leading-[1.5] text-[var(--text-tertiary,#64646f)]">
          <Sparkles {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
          Answers come only from stored claims, and every sentence cites the
          claim it rests on.
        </p>
      ) : null}
    </div>
  );
}
