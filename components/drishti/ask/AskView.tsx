"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQuery } from "convex/react";
import { ArrowUp, CircleAlert, Clock3, Database, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Button } from "../Button";
import { Skeleton } from "../Skeleton";
import { TrailSkeleton } from "../Trail";
import {
  FOCUS_RING_CLASS,
  LABEL_CLASS,
  VALUE_CLASS,
  iconProps,
} from "../tokens";
import { AskTranscript } from "./AskTranscript";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-border pb-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-accent/30 bg-accent-dim text-accent">
            <ShieldCheck className="size-3" /> Grounded research
          </Badge>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-tertiary">Ask workspace</span>
        </div>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-fg sm:text-4xl">Ask Drishti</h1>
            <p className="mt-2 max-w-[64ch] text-sm leading-6 text-fg-secondary">Ask a focused question about the public signals in your research desk. Answers stay inside stored claims and show their evidence.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-fg-secondary"><Database className="size-3.5 text-accent" /><span>{scopeText}</span></div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="border-border bg-bg-raised shadow-[var(--shadow-lift)]">
            <CardHeader className="gap-2 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base"><span className="flex size-7 items-center justify-center rounded-md bg-accent-dim text-accent"><Send className="size-3.5" /></span>What do you want to know?</CardTitle>
              <p className="text-sm font-normal text-fg-secondary">Use a specific comparison or ask what changed. Drishti will show the source trail with the answer.</p>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={(event) => { event.preventDefault(); void submit(value); }} className="flex flex-col gap-3">
                <label htmlFor="ask-question" className="sr-only">Ask a question about the rivals in view</label>
                <Textarea id="ask-question" name="question" value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" disabled={asking} aria-invalid={error !== null || undefined} placeholder="Which rival is leaning hardest on discount hooks?" className="min-h-28 resize-y border-border-strong bg-bg text-base leading-6 placeholder:text-fg-placeholder focus-visible:border-accent focus-visible:ring-accent/20" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-fg-tertiary"><ShieldCheck className="size-3.5 text-ok" /> Answers cite stored claims only</span>
                  <button type="submit" disabled={!canSend} aria-label="Ask" aria-busy={asking || undefined} className={cn("inline-flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-fg-tertiary", FOCUS_RING_CLASS)}>
                    {asking ? <Clock3 className="size-4 animate-pulse motion-reduce:animate-none" /> : <ArrowUp className="size-4" />} {asking ? "Researching" : "Ask Drishti"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {!hasTranscript ? <section aria-label="Suggested questions" className="flex flex-col gap-3"><div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-tertiary">Start with a question</span><Separator className="flex-1" /></div><div className="grid gap-2 sm:grid-cols-3">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" disabled={asking} onClick={() => void submit(suggestion)} className="rounded-lg border border-border bg-bg-raised px-3 py-3 text-left text-sm leading-5 text-fg-secondary transition-[border-color,background-color,color] duration-150 ease-out hover:border-accent/50 hover:bg-accent-dim hover:text-fg disabled:cursor-not-allowed disabled:opacity-50">{suggestion}</button>)}</div></section> : null}

          {hasTranscript ? <section className="flex flex-col gap-6" aria-label="Ask transcript"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-tertiary">Research transcript</span><Badge variant="secondary">{exchanges.length} {exchanges.length === 1 ? "question" : "questions"}</Badge></div><Button variant="ghost" size="sm" onClick={resetAskExchanges}>Clear transcript</Button></div>{exchanges.map((exchange) => <AskTranscript key={exchange.id} exchange={exchange} claimIndex={claimIndex} onRetry={(question) => { void submit(question); }} retrying={asking} />)}</section> : null}
        </div>

        <aside className="flex flex-col gap-3 lg:pt-1"><Card size="sm" className="border-border bg-bg-raised"><CardHeader><CardTitle className="text-sm">How Ask works</CardTitle></CardHeader><CardContent className="space-y-3 text-xs leading-5 text-fg-secondary"><p>Questions are matched to the latest stored claims for the brands in view.</p><p>Every useful sentence links back to an evidence record. Missing data stays visible.</p><div className="flex items-center gap-2 border-t border-border pt-3 font-medium text-fg"><Database className="size-3.5 text-accent" /> {scopeText}</div></CardContent></Card><Card size="sm" className="border-border bg-bg-inset"><CardContent className="flex gap-2 p-3 text-xs leading-5 text-fg-secondary"><Clock3 className="mt-0.5 size-3.5 shrink-0 text-fg-tertiary" /><span>Need a fresh answer? Refresh the cohort first so Ask has current evidence.</span></CardContent></Card></aside>
      </div>

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

      {!hasTranscript && pendingQuestion === null ? null : null}
    </div>
  );
}
