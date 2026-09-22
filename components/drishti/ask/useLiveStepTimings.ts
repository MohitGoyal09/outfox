"use client";


import { useEffect, useState } from "react";
import type { ToolCallCardView } from "./ask-model";

function isUnsettled(status: ToolCallCardView["status"]): boolean {
  return status === "running" || status === "pending";
}

export function useLiveStepTimings(cards: ToolCallCardView[]): Map<string, number> {
  const [startedAt, setStartedAt] = useState<Record<string, number>>({});
  const [settledAt, setSettledAt] = useState<Record<string, number>>({});
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const at = Date.now();
      setStartedAt((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const card of cards) {
          if (!(card.id in next)) {
            next[card.id] = at;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      setSettledAt((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const card of cards) {
          if (!isUnsettled(card.status) && !(card.id in next)) {
            next[card.id] = at;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      setNow((prev) => prev ?? at);
    }, 0);
    return () => clearTimeout(id);
  }, [cards]);

  const anyRunning = cards.some((card) => isUnsettled(card.status));
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [anyRunning]);

  const elapsed = new Map<string, number>();
  for (const card of cards) {
    const start = startedAt[card.id];
    if (start === undefined) continue;
    const end = settledAt[card.id] ?? now ?? start;
    elapsed.set(card.id, Math.max(0, end - start));
  }
  return elapsed;
}
