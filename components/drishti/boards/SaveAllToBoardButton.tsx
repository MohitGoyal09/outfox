"use client";


import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
  bulkSaveOutcomeMessage,
  isAtBoardCap,
  pinDefaultBoardFirst,
  type BoardItemContext,
  type BulkSaveOutcome,
} from "./boards-model";

type BoardRow = { _id: Id<"boards">; name: string; createdAt: string };
type RowState = { boardId: Id<"boards">; kind: "busy" } | { boardId: Id<"boards">; kind: "done"; message: string; isError: boolean };

export function SaveAllToBoardButton({
  claimIds,
  totalCount,
  context,
  className,
}: {
  claimIds: Id<"claims">[];
  totalCount: number;
  context?: BoardItemContext;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const boards = useQuery(api.boards.listBoards, open ? {} : "skip");
  const createBoard = useMutation(api.boards.createBoard);
  const addItems = useMutation(api.boards.addItems);

  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [rowState, setRowState] = useState<RowState | null>(null);

  const ordered = boards ? pinDefaultBoardFirst(boards as BoardRow[]) : null;
  const hasDefaultBoard = ordered?.some((board) => board.name === DEFAULT_BOARD_NAME) ?? false;
  const missingClaim = totalCount - claimIds.length;

  async function saveAllTo(boardId: Id<"boards">, boardName: string) {
    setRowState({ boardId, kind: "busy" });
    try {
      const result = await addItems({ boardId, claimIds, ...(context ? { context } : {}) });
      const outcome: BulkSaveOutcome = {
        requested: totalCount,
        saved: result.saved,
        duplicate: result.duplicate,
        missingClaim: missingClaim + result.missingClaim,
        overCap: result.overCap,
      };
      const message = bulkSaveOutcomeMessage(outcome, boardName);
      setRowState({ boardId, kind: "done", message, isError: false });
      if (result.saved > 0) toast.success(message);
      else toast(message);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save these sources.";
      setRowState({ boardId, kind: "done", message, isError: true });
      toast.error(message);
    }
  }

  async function saveAllToDefault() {
    const existing = ordered?.find((board) => board.name === DEFAULT_BOARD_NAME);
    const boardId = existing?._id ?? (await createBoard({ name: DEFAULT_BOARD_NAME }));
    await saveAllTo(boardId, DEFAULT_BOARD_NAME);
  }

  async function handleCreateAndSave() {
    const name = newBoardName.trim();
    if (name === "" || creating) return;
    setCreating(true);
    try {
      const boardId = await createBoard({ name });
      setNewBoardName("");
      await saveAllTo(boardId, name);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not create the board.";
      setRowState({ boardId: "new" as Id<"boards">, kind: "done", message, isError: true });
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  if (claimIds.length === 0) return null;

  const isBusy = rowState?.kind === "busy";

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setRowState(null); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("gap-1.5", className)}
        >
          <Bookmark className="size-3.5" />
          {`Save all ${claimIds.length} source${claimIds.length === 1 ? "" : "s"}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex flex-col gap-1 p-1.5">
          <button
            type="button"
            onClick={() => void saveAllToDefault()}
            disabled={isBusy || ordered === null}
            className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] font-medium text-fg hover:bg-bg-inset disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{ordered !== null && !hasDefaultBoard ? `${DEFAULT_BOARD_NAME} (new)` : DEFAULT_BOARD_NAME}</span>
            <BulkRowStatus rowState={rowState} boardId={ordered?.find((b) => b.name === DEFAULT_BOARD_NAME)?._id} isPendingDefault={ordered !== null} />
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
                  onClick={() => void saveAllTo(board._id, board.name)}
                  disabled={isBusy}
                  className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] text-fg hover:bg-bg-inset disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate">{board.name}</span>
                  <BulkRowStatus rowState={rowState} boardId={board._id} />
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

function BulkRowStatus({
  rowState,
  boardId,
  isPendingDefault = false,
}: {
  rowState: RowState | null;
  boardId: Id<"boards"> | undefined;
  isPendingDefault?: boolean;
}) {
  const busyHere = rowState?.kind === "busy" && (rowState.boardId === boardId || (isPendingDefault && boardId === undefined));
  if (busyHere) return <Loader2 className="size-3.5 shrink-0 animate-spin text-fg-secondary" />;
  const doneHere = rowState?.kind === "done" && (rowState.boardId === boardId || (isPendingDefault && boardId === undefined));
  if (doneHere && !rowState.isError) return <Check className="size-3.5 shrink-0 text-accent" />;
  return null;
}
