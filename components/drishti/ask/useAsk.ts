"use client";

import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AskScope } from "./ask-model";
import { nextExchangeId, pushAskExchange, type AskExchange } from "./ask-store";

export function useAskSubmit() {
  const answerQuestion = useAction(api.ask.answerQuestion);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (question: string, scope: AskScope): Promise<AskExchange | null> => {
      const trimmed = question.trim().slice(0, 2000);
      if (trimmed === "") return null;
      setAsking(true);
      setError(null);
      const startedAt = Date.now();
      try {
        const latestRequested = /\blatest\b/i.test(trimmed);
        const result = await answerQuestion({
          question: trimmed,
          brandIds: scope.brandIds,
          ...(scope.runId !== null ? { runId: scope.runId } : {}),
          ...(latestRequested ? { latestRequested: true } : {}),
        });
        const exchange: AskExchange = {
          id: nextExchangeId(),
          question: trimmed,
          brandIds: scope.brandIds,
          cohortKey: scope.cohortKey,
          result,
          askedAt: new Date().toISOString(),
          latencyMs: Date.now() - startedAt,
        };
        pushAskExchange(exchange);
        return exchange;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Ask failed.");
        return null;
      } finally {
        setAsking(false);
      }
    },
    [answerQuestion],
  );

  const clearError = useCallback(() => setError(null), []);

  return { ask, asking, error, clearError };
}
