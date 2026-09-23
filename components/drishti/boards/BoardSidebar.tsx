"use client";


import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <ul className="flex flex-col gap-1">
        {ordered.map((board) => (
          <li key={board._id}>
            <button
              type="button"
              onClick={() => onSelect(board._id as Id<"boards">)}
              aria-current={board._id === selectedBoardId ? "true" : undefined}
              className={cn(
                "w-full truncate rounded-md px-3 py-2 text-left text-[13px] transition-colors",
                board._id === selectedBoardId
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {board.name}
            </button>
          </li>
        ))}
      </ul>

      {atCap ? (
        <p className="px-3 text-[11px] text-muted-foreground">
          You have 50 boards, the limit. Delete one to make another.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitCreate();
          }}
          className="flex items-center gap-1.5 px-1"
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New board"
            aria-label="New board name"
            className="h-8 text-[13px]"
          />
          <Button type="submit" size="icon-sm" variant="outline" disabled={name.trim() === "" || creating} aria-label="Create board">
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          </Button>
        </form>
      )}
      {error !== null ? <p className="px-3 text-[11px] text-destructive">{error}</p> : null}
    </nav>
  );
}
