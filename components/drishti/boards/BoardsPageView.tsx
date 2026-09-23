"use client";


import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { LayoutGrid, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";
import { iconProps } from "../tokens";
import { pinDefaultBoardFirst } from "./boards-model";
import { BoardSidebar } from "./BoardSidebar";
import { BoardDetail } from "./BoardDetail";

export function BoardsPageView() {
  const boards = useQuery(api.boards.listBoards);
  const createBoard = useMutation(api.boards.createBoard);
  const renameBoard = useMutation(api.boards.renameBoard);
  const deleteBoard = useMutation(api.boards.deleteBoard);
  const removeItem = useMutation(api.boards.removeItem);

  const [pickedBoardId, setPickedBoardId] = useState<Id<"boards"> | null>(null);

  const ordered = useMemo(() => (boards ? pinDefaultBoardFirst(boards) : []), [boards]);
  const pickStillExists = pickedBoardId !== null && ordered.some((board) => board._id === pickedBoardId);
  const selectedBoardId = pickStillExists ? pickedBoardId : (ordered[0]?._id ?? null);

  const items = useQuery(api.boards.listItems, selectedBoardId ? { boardId: selectedBoardId } : "skip");
  const selectedBoard = ordered.find((board) => board._id === selectedBoardId) ?? null;

  async function handleCreate(name: string): Promise<Id<"boards"> | null> {
    const boardId = await createBoard({ name });
    setPickedBoardId(boardId);
    return boardId;
  }

  if (boards === undefined) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <EmptyState
        icon={<LayoutGrid {...iconProps} size={16} />}
        title="No boards yet."
        description="A board is a named shortlist of saved evidence — a swipe file. Save an evidence card from a brand's Evidence tab, or create one here to get started."
        action={
          <BoardCreateInline onCreate={handleCreate} />
        }
      />
    );
  }

  return (
    <div className="grid gap-6 min-[900px]:grid-cols-[220px_minmax(0,1fr)] min-[900px]:items-start">
      <aside className="min-w-0">
        <BoardSidebar
          boards={ordered}
          selectedBoardId={selectedBoardId}
          onSelect={setPickedBoardId}
          onCreate={handleCreate}
        />
      </aside>
      <div className="min-w-0">
        {selectedBoard === null ? (
          <EmptyState
            icon={<LayoutGrid {...iconProps} size={16} />}
            title="Pick a board."
            description="Choose a board from the list to see what's saved to it."
          />
        ) : (
          <BoardDetail
            board={selectedBoard}
            items={items}
            onRename={async (name) => {
              await renameBoard({ boardId: selectedBoard._id, name });
            }}
            onDelete={async () => {
              await deleteBoard({ boardId: selectedBoard._id });
            }}
            onRemoveItem={async (itemId) => {
              await removeItem({ itemId });
            }}
          />
        )}
      </div>
    </div>
  );
}

function BoardCreateInline({ onCreate }: { onCreate: (name: string) => Promise<Id<"boards"> | null> }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (trimmed === "" || creating) return;
    setCreating(true);
    try {
      await onCreate(trimmed);
    } finally {
      setCreating(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="flex items-center gap-2"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Board name, e.g. Discount hooks"
        aria-label="New board name"
        className="h-9 w-56 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
      />
      <Button type="submit" size="sm" disabled={name.trim() === "" || creating} className="gap-1.5">
        <Plus className="size-3.5" /> Create board
      </Button>
    </form>
  );
}
