"use client";


import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Check, ChevronDown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../Button";
import { iconProps } from "../tokens";
import { boardAfterDelete, isAtBoardCap, MAX_BOARDS_PER_OWNER } from "./boards-model";

type Dlg = "new" | "rename" | "delete" | null;

export function BoardSwitcher({ boardId, name }: { boardId: Id<"boards">; name: string }) {
  const router = useRouter();
  const boards = useQuery(api.boards.listBoards);
  const createBoard = useMutation(api.boards.createBoard);
  const renameBoard = useMutation(api.boards.renameBoard);
  const deleteBoard = useMutation(api.boards.deleteBoard);
  const [dialog, setDialog] = useState<Dlg>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = boards ?? [];
  const atCap = isAtBoardCap(list.length);

  const open = (kind: Exclude<Dlg, null>) => {
    setDraft(kind === "rename" ? name : "");
    setError(null);
    setDialog(kind);
  };

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      setDialog(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const submitName = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed === "" || busy) return;
    void run(async () => {
      if (dialog === "new") router.push(`/boards/${await createBoard({ name: trimmed })}`);
      else await renameBoard({ boardId, name: trimmed });
    });
  };

  const confirmDelete = () =>
    void run(async () => {
      const next = boardAfterDelete(list, boardId);
      if (next) router.replace(`/boards/${next._id}`);
      await deleteBoard({ boardId });
      if (!next) router.replace("/boards");
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Board: ${name}. Switch board`}
            className="focus-ring flex min-h-8 max-w-[14rem] items-center gap-1.5 rounded-sm px-2 text-[13px] font-semibold text-fg hover:bg-bg-inset"
          >
            <span className="truncate">{name}</span>
            <ChevronDown {...iconProps} size={14} aria-hidden="true" className="size-3.5 shrink-0 text-fg-tertiary" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 min-w-56 overflow-y-auto">
          {list.map((b) => (
            <DropdownMenuItem key={b._id} onSelect={() => b._id !== boardId && router.push(`/boards/${b._id}`)}>
              <span className="truncate">{b.name}</span>
              {b._id === boardId ? <Check {...iconProps} size={14} aria-hidden="true" className="ml-auto size-3.5" /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={atCap} onSelect={() => open("new")}>
            <Plus {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            {atCap ? `Limit of ${MAX_BOARDS_PER_OWNER} boards` : "New board"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => open("rename")}>
            <Pencil {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            Rename board
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => open("delete")}>
            <Trash2 {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            Delete board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "new" || dialog === "rename"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <form onSubmit={submitName} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{dialog === "new" ? "New board" : "Rename board"}</DialogTitle>
              <DialogDescription>
                {dialog === "new" ? "Give the board a short name, like Discount hooks." : "Pick a new name for this board."}
              </DialogDescription>
            </DialogHeader>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Board name"
              placeholder="Board name"
              className="focus-ring h-9 rounded-sm border border-border-strong bg-bg-raised px-3 text-[13px] text-fg placeholder:text-fg-placeholder"
            />
            {error ? <p role="alert" className="text-[12px] text-danger">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={draft.trim() === "" || busy}>
                {dialog === "new" ? "Create board" : "Save name"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{name}&rdquo;?</DialogTitle>
            <DialogDescription>This deletes the board and everything on it: evidence, notes and frames. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          {error ? <p role="alert" className="text-[12px] text-danger">{error}</p> : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={busy}
              icon={busy ? <Loader2 {...iconProps} size={14} aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" /> : undefined}
            >
              Delete board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
