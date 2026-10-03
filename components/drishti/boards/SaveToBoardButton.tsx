"use client";


import { useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Bookmark, Check, Loader2, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_BOARD_NAME,
  isAtBoardCap,
  isAtItemCap,
  itemsContainClaim,
  pinDefaultBoardFirst,
  saveOutcomeMessage,
  type BoardItemContext,
  type SaveOutcome,
} from "./boards-model";

type BoardRow = { _id: Id<"boards">; name: string; createdAt: string };
type RowState = { boardId: Id<"boards">; kind: "busy" } | { boardId: Id<"boards">; kind: "done"; outcome: SaveOutcome };

function notify(outcome: SaveOutcome) {
  const message = saveOutcomeMessage(outcome);
  if (outcome.kind === "saved") toast.success(message);
  else if (outcome.kind === "duplicate") toast(message);
  else toast.error(message);
}

export function SaveToBoardButton({
  claimId,
  variant = "icon",
  className,
  context,
}: {
  claimId: Id<"claims">;
  variant?: "icon" | "labeled";
  className?: string;
  context?: BoardItemContext;
}) {
  const [open, setOpen] = useState(false);
  const boards = useQuery(api.boards.listBoards, open ? {} : "skip");
  const createBoard = useMutation(api.boards.createBoard);
  const addItem = useMutation(api.boards.addItem);
  const convex = useConvex();

  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [rowState, setRowState] = useState<RowState | null>(null);
  const [savedBoardIds, setSavedBoardIds] = useState<ReadonlySet<Id<"boards">>>(new Set());

  const ordered = boards ? pinDefaultBoardFirst(boards as BoardRow[]) : null;
  const hasDefaultBoard = ordered?.some((board) => board.name === DEFAULT_BOARD_NAME) ?? false;

  async function saveTo(boardId: Id<"boards">, boardName: string) {
    setRowState({ boardId, kind: "busy" });
    let outcome: SaveOutcome;
    try {
      const items = await convex.query(api.boards.listItems, { boardId });
      if (itemsContainClaim(items, claimId)) {
        outcome = { kind: "duplicate", boardName };
      } else if (isAtItemCap(items.length)) {
        outcome = { kind: "full", boardName };
      } else {
        await addItem({ boardId, claimId, ...(context ? { context } : {}) });
        outcome = { kind: "saved", boardName };
      }
      setSavedBoardIds((prev) => new Set(prev).add(boardId));
    } catch (caught) {
      outcome = { kind: "error", message: caught instanceof Error ? caught.message : "Could not save this evidence." };
    }
    setRowState({ boardId, kind: "done", outcome });
    notify(outcome);
  }

  async function saveToDefault() {
    const existing = ordered?.find((board) => board.name === DEFAULT_BOARD_NAME);
    const boardId = existing?._id ?? (await createBoard({ name: DEFAULT_BOARD_NAME }));
    await saveTo(boardId, DEFAULT_BOARD_NAME);
  }

  async function handleCreateAndSave() {
    const name = newBoardName.trim();
    if (name === "" || creating) return;
    setCreating(true);
    try {
      const boardId = await createBoard({ name });
      setNewBoardName("");
      await saveTo(boardId, name);
    } catch (caught) {
      const outcome: SaveOutcome = { kind: "error", message: caught instanceof Error ? caught.message : "Could not create the board." };
      setRowState({ boardId: "new" as Id<"boards">, kind: "done", outcome });
      notify(outcome);
    } finally {
      setCreating(false);
    }
  }

  const isBusy = rowState?.kind === "busy";

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setRowState(null); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={variant === "icon" ? "icon-sm" : "sm"}
          aria-label="Save evidence to a board"
          className={cn(variant === "icon" ? "" : "gap-1.5", className)}
        >
          <Bookmark className="size-3.5" />
          {variant === "labeled" ? "Save" : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="flex flex-col gap-1 p-1.5">
          <button
            type="button"
            onClick={() => void saveToDefault()}
            disabled={isBusy || ordered === null}
            className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] font-medium text-fg hover:bg-bg-inset disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{ordered !== null && !hasDefaultBoard ? `${DEFAULT_BOARD_NAME} (new)` : DEFAULT_BOARD_NAME}</span>
            <RowStatus rowState={rowState} boardId={ordered?.find((b) => b.name === DEFAULT_BOARD_NAME)?._id} savedBoardIds={savedBoardIds} isPendingDefault={ordered !== null} />
          </button>

          {ordered === null ? (
            <p className="px-2 py-1.5 text-[12px] text-fg-secondary">Loading your boards…</p>
          ) : (
            ordered
              .filter((board) => board.name !== DEFAULT_BOARD_NAME)
              .map((board) => (
                <button
                  key={board._id}
                  type="button"
                  onClick={() => void saveTo(board._id, board.name)}
                  disabled={isBusy}
                  className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] text-fg hover:bg-bg-inset disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate">{board.name}</span>
                  <RowStatus rowState={rowState} boardId={board._id} savedBoardIds={savedBoardIds} />
                </button>
              ))
          )}
        </div>

        <div className="border-t border-border p-1.5">
          {ordered !== null && isAtBoardCap(ordered.length) ? (
            <p className="px-1 py-1 text-[11px] text-fg-secondary">You have 50 boards, the limit. Delete one to make another.</p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateAndSave();
              }}
              className="flex items-center gap-1.5 px-0.5 py-0.5"
            >
              <Input
                value={newBoardName}
                onChange={(event) => setNewBoardName(event.target.value)}
                placeholder="New board"
                className="h-7 text-[12px]"
                aria-label="New board name"
              />
              <Button type="submit" size="icon-sm" variant="outline" disabled={newBoardName.trim() === "" || creating} aria-label="Create board and save">
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              </Button>
            </form>
          )}
        </div>

      </PopoverContent>
    </Popover>
  );
}

function RowStatus({
  rowState,
  boardId,
  savedBoardIds,
  isPendingDefault = false,
}: {
  rowState: RowState | null;
  boardId: Id<"boards"> | undefined;
  savedBoardIds: ReadonlySet<Id<"boards">>;
  isPendingDefault?: boolean;
}) {
  const busyHere = rowState?.kind === "busy" && (rowState.boardId === boardId || (isPendingDefault && boardId === undefined));
  if (busyHere) return <Loader2 className="size-3.5 shrink-0 animate-spin text-fg-secondary" />;
  if (boardId !== undefined && savedBoardIds.has(boardId)) {
    return <Check className="size-3.5 shrink-0 text-accent" />;
  }
  return null;
}
