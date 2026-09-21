import type { AnswerQuestionResult } from "@/convex/ask";
import type { Id } from "@/convex/_generated/dataModel";

export type AskExchange = {
  id: string;
  question: string;
  brandIds: Id<"brands">[];
  cohortKey: string | null;
  result: AnswerQuestionResult;
  askedAt: string;
  latencyMs: number;
};

let exchanges: AskExchange[] = [];
const listeners = new Set<() => void>();
let sequence = 0;

export function nextExchangeId(): string {
  sequence += 1;
  return `ask-${Date.now()}-${sequence}`;
}

export function pushAskExchange(exchange: AskExchange): void {
  exchanges = [...exchanges, exchange];
  for (const listener of listeners) listener();
}

export function getAskExchanges(): AskExchange[] {
  return exchanges;
}

export function subscribeAskExchanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetAskExchanges(): void {
  exchanges = [];
  for (const listener of listeners) listener();
}
