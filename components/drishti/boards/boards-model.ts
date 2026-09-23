

export type BoardSummary = {
  _id: string;
  name: string;
  createdAt: string;
};

export function findDefaultBoard<T extends BoardSummary>(boards: readonly T[]): T | null {
  return boards.find((board) => board.name === DEFAULT_BOARD_NAME) ?? null;
}

export type BoardItemContext = {
  question?: string;
  threadKey?: string;
  pageLabel?: string;
};

export function boardItemThreadHref(threadKey: string): string {
  return threadKey === "" ? "/ask" : `/ask?chat=${encodeURIComponent(threadKey)}`;
}

export type BulkSaveOutcome = {
  requested: number;
  saved: number;
  duplicate: number;
  missingClaim: number;
  overCap: number;
};

export function bulkSaveOutcomeMessage(outcome: BulkSaveOutcome, boardName: string): string {
  const reasons: string[] = [];
  if (overCap > 0) {
    reasons.push(`${overCap} didn't fit — ${boardName} is full at ${MAX_ITEMS_PER_BOARD} items`);
  }
  const head = `Saved ${saved} of ${requested} to ${boardName}.`;
  return reasons.length === 0 ? head : `${head} ${reasons.join(", ")}.`;
}

export type SaveOutcome =
  | { kind: "saved"; boardName: string }
  | { kind: "duplicate"; boardName: string }
  | { kind: "full"; boardName: string }
  | { kind: "error"; message: string };

export function saveOutcomeMessage(outcome: SaveOutcome): string {
  switch (outcome.kind) {
    case "saved":
      return `Saved to ${outcome.boardName}.`;
    case "duplicate":
      return `Already on ${outcome.boardName}.`;
    case "full":
      return `${outcome.boardName} is full at ${MAX_ITEMS_PER_BOARD} items.`;
    case "error":
      return outcome.message;
  }
}
