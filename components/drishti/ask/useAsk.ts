"use client";

import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AnswerQuestionResult } from "@/convex/ask";
import type { AskScope } from "./ask-model";

export function useAskSubmit() {
  const answerQuestion = useAction(api.ask.answerQuestion);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (
      question: string,
      scope: AskScope,
      threadKey: string,
    ): Promise<AnswerQuestionResult | null> => {
      const trimmed = question.trim().slice(0, 2000);
      if (trimmed === "") return null;
      setAsking(true);
      setError(null);
      try {
        const latestRequested = /\blatest\b/i.test(trimmed);
        const result = await answerQuestion({
          question: trimmed,
          brandIds: scope.brandIds,
          threadKey,
          ...(scope.runId !== null ? { runId: scope.runId } : {}),
          ...(latestRequested ? { latestRequested: true } : {}),
        });
        return result;
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
