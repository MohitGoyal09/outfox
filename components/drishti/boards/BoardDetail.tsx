"use client";


import { useState } from "react";
import Link from "next/link";
import { Bookmark, Loader2, Pencil, Shapes, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonClasses } from "../Button";
import { EmptyState } from "../EmptyState";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { VALUE_CLASS, iconProps } from "../tokens";
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
              <input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={() => void submitRename()}
                aria-label="Board name"
                className="focus-ring h-8 max-w-[260px] rounded-sm border border-border-strong bg-bg-raised px-2 text-[15px] font-semibold text-fg"
              />
              {renaming ? (
                <Loader2 {...iconProps} size={16} aria-hidden="true" className="size-4 animate-spin text-fg-tertiary motion-reduce:animate-none" />
              ) : null}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftName(board.name);
                setEditingName(true);
              }}
              className="group flex items-center gap-1.5 rounded-sm text-left"
            >
              <h1 className="truncate type-title text-fg">{board.name}</h1>
              <Pencil
                {...iconProps}
                size={14}
                aria-hidden="true"
                className="size-3.5 shrink-0 text-fg-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </button>
          )}
          <p className={cn(VALUE_CLASS, "mt-1 text-[12px] text-fg-tertiary")}>
            {items === undefined ? "Loading…" : formatItemCount(items.length)}
            {atCap ? ` · full at ${MAX_ITEMS_PER_BOARD}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <Link href={`/boards/${board._id}`} className={buttonClasses({ variant: "primary", size: "sm" })}>
          <Shapes {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
          Open canvas
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:text-danger"
          onClick={() => setConfirmDelete(true)}
          icon={<Trash2 {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
        >
          Delete board
        </Button>
        </div>
      </header>

      {atCap ? (
        <p className="max-w-[68ch] text-[12px] leading-[1.5] text-fg-secondary">
          This board is full at {MAX_ITEMS_PER_BOARD} items, the most this surface holds. Remove one to save another here, or use a different board.
        </p>
      ) : null}

      {items === undefined ? (
        <SkeletonRegion
          label="Loading saved items"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-bg-raised p-4 shadow-xs">
              <Skeleton variant="text" width="46%" />
              <span className="mt-4 block">
                <Skeleton variant="block" height={104} />
              </span>
            </div>
          ))}
        </SkeletonRegion>
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
            <Button
              variant="danger"
              onClick={() => void confirmAndDelete()}
              disabled={deleting}
              icon={
                deleting ? (
                  <Loader2 {...iconProps} size={14} aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <X {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
                )
              }
            >
              Delete board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}