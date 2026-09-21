"use client";

import { MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { LABEL_CLASS } from "@/components/drishti";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useState } from "react";

type AskResult = {
  available: boolean;
  answer: string;
  citations: string[];
  mode: string;
  message?: string;
  error?: string;
  needsRefresh?: boolean;
};

export function AskBar({
  brandIds,
  runId,
  className,
}: {
  brandIds: Id<"brands">[];
  runId?: Id<"runs">;
  className?: string;
}) {
  const answerQuestion = useAction(api.ask.answerQuestion);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);

  async function ask(question: string) {
    const trimmed = question.trim().slice(0, 2000);
    if (trimmed === "" || brandIds.length === 0) return;
    setAsking(true);
    setError(null);
    try {
      const latestRequested = /latest/i.test(trimmed);
      const out = (await answerQuestion({
        question: trimmed,
        brandIds,
        ...(runId !== undefined ? { runId } : {}),
        ...(latestRequested ? { latestRequested: true } : {}),
      })) as AskResult;
      setResult(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ask failed.");
      setResult(null);
    } finally {
      setAsking(false);
    }
  }

  if (brandIds.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        Pick at least one brand to ask a question.
      </div>
    );
  }

  return (
    <Card aria-label="Ask about these brands" className={cn("border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4"><CardTitle className="text-sm font-semibold tracking-[-0.01em]">Ask</CardTitle>
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>stored evidence</span>
      </CardHeader><CardContent className="p-5"><PromptInput
        onSubmit={(message) => {
          void ask(message.text);
        }}
        className="mt-3"
      >
        <PromptInputTextarea
          placeholder="Ask about pricing, hooks, or creative gaps"
          maxLength={2000}
        />
        <div className="flex items-center justify-end gap-2 p-2">
          <PromptInputSubmit
            status={asking ? "streaming" : "ready"}
            disabled={asking}
          />
        </div>
      </PromptInput><div className="mt-3">
        {asking ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" /> Answering from stored claims.
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : result && result.available === false ? (
          <Alert><AlertTitle>Ask is unavailable</AlertTitle><AlertDescription>
              {result.message ??
                "Ask needs an LLM gateway key. Stored claims are still visible above."}
            </AlertDescription></Alert>
        ) : result && result.mode === "empty" ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {result.message ??
              result.answer ??
              "No stored claims cover these brands yet."}
            {result.needsRefresh ? (
              <p className="mt-1">
                Run a live refresh, then ask again.
              </p>
            ) : null}
          </div>
        ) : result && result.mode === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            {result.error ?? result.message ?? "Ask failed."}
          </p>
        ) : result && result.answer !== "" ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <MessageResponse>{result.answer}</MessageResponse>
            {result.citations.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Cited: {result.citations.join(", ")}
              </p>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setResult(null)}
            >
              Clear answer
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Answers cite stored claims only. No new fetch runs from here.
          </p>
        )}
      </div></CardContent>
    </Card>
  );
}
