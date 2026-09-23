"use client";


import { useState } from "react";
import { Bookmark, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "../EmptyState";
import { iconProps } from "../tokens";
import { isAtItemCap, formatItemCount, MAX_ITEMS_PER_BOARD, type BoardSummary } from "./boards-model";
import { BoardItemCard, type BoardItem } from "./BoardItemCard";

export function BoardDetail({
  board,
  items,
  onRename,
  onDelete,
  onRemoveItem,
}: {
  board: BoardSummary;
  items: BoardItem[] | undefined;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onRemoveItem: (itemId: BoardItem["_id"]) => Promise<void>;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(board.name);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submitRename() {
    const trimmed = draftName.trim();
    if (trimmed === "" || trimmed === board.name) {
      setEditingName(false);
      setDraftName(board.name);
      return;
    }
    setRenaming(true);
    try {
      await onRename(trimmed);
      setEditingName(false);
    } finally {
      setRenaming(false);
    }
  }

  async function confirmAndDelete() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const atCap = items !== undefined && isAtItemCap(items.length);

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          {editingName ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitRename();
              }}
              className="flex items-center gap-1.5"
            >
              <Input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={() => void submitRename()}
                aria-label="Board name"
                className="h-8 max-w-[260px] text-[15px] font-semibold"
              />
              {renaming ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftName(board.name);
                setEditingName(true);
              }}
              className="group flex items-center gap-1.5 text-left"
            >
              <h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-foreground">{board.name}</h1>
              <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
          )}
          <p className="mt-1 font-mono text-[12px] text-muted-foreground">
            {items === undefined ? "Loading…" : formatItemCount(items.length)}
            {atCap ? ` · full at ${MAX_ITEMS_PER_BOARD}` : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-3.5" /> Delete board
        </Button>
      </header>

      {atCap ? (
        <p className="max-w-[68ch] text-[12px] text-muted-foreground">
          This board is full at {MAX_ITEMS_PER_BOARD} items — the most this surface holds. Remove one to save another here, or use a different board.
        </p>
      ) : null}

      {items === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading saved items">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bookmark {...iconProps} size={16} />}
          title="Nothing saved to this board yet."
          description="Save an evidence card from a brand's Evidence tab, or a source from a chat answer, and it lands here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <BoardItemCard key={item._id} item={item} onRemove={() => onRemoveItem(item._id)} />
          ))}
        </div>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{board.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              {items === undefined
                ? "This deletes the board and everything saved to it."
                : `This deletes the board and its ${formatItemCount(items.length)}. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmAndDelete()} disabled={deleting} className="gap-1.5">
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Delete board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
