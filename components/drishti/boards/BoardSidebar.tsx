"use client";


import { useState } from "react";
import { LayoutGrid, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "../Button";
import { VALUE_CLASS, iconProps } from "../tokens";
import { isAtBoardCap, pinDefaultBoardFirst, type BoardSummary } from "./boards-model";

export function BoardSidebar({
  boards,
  selectedBoardId,
  onSelect,
  onCreate,
}: {
  boards: BoardSummary[];
  selectedBoardId: Id<"boards"> | null;
  onSelect: (boardId: Id<"boards">) => void;
  onCreate: (name: string) => Promise<Id<"boards"> | null>;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ordered = pinDefaultBoardFirst(boards);
  const atCap = isAtBoardCap(boards.length);

  async function submitCreate() {
    const trimmed = name.trim();
    if (trimmed === "" || creating) return;
    setCreating(true);
    setError(null);
    try {
      const boardId = await onCreate(trimmed);
      if (boardId) {
        setName("");
      } else {
        setError("Could not create that board.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create that board.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <nav aria-label="Boards" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="type-label text-fg-tertiary">Boards</span>
        <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>{ordered.length}</span>
      </div>

      <ul className="flex flex-col gap-1">
        {ordered.map((board) => {
          const selected = board._id === selectedBoardId;
          return (
            <li key={board._id}>
              <button
                type="button"
                onClick={() => onSelect(board._id as Id<"boards">)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm border px-2.5 py-2 text-left text-[13px] transition-colors",
                  selected
                    ? "border-accent bg-accent font-medium text-accent-ink shadow-xs hover:bg-accent-strong"
                    : "border-transparent text-fg-secondary hover:border-border hover:bg-bg-raised hover:text-fg",
                )}
              >
                <LayoutGrid
                  {...iconProps}
                  size={14}
                  aria-hidden="true"
                  className={cn("size-3.5 shrink-0", selected ? "text-accent-ink" : "text-fg-tertiary")}
                />
                <span className="truncate">{board.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {atCap ? (
        <p className="px-1 text-[11px] leading-[1.45] text-fg-tertiary">
          You have 50 boards, the limit. Delete one to make another.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitCreate();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New board"
            aria-label="New board name"
            className="focus-ring h-8 min-w-0 flex-1 rounded-sm border border-border-strong bg-bg-raised px-2.5 text-[13px] text-fg placeholder:text-fg-placeholder"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={name.trim() === "" || creating}
            aria-label="Create board"
            className="w-8 shrink-0 px-0"
          >
            {creating ? (
              <Loader2 {...iconProps} size={14} aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : (
              <Plus {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            )}
          </Button>
        </form>
      )}
      {error !== null ? <p className="px-1 text-[11px] text-danger">{error}</p> : null}
    </nav>
  );
}