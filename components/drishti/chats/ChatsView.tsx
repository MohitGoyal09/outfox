"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { DataTable, type DataTableColumn } from "../DataTable";
import { PageHeader } from "../PageHeader";
import { PillButton } from "../PillButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RelativeTime } from "../RelativeTime";
import type { ThreadSummary } from "./chat-groups";

export function ChatsView() {
  const router = useRouter();
  const threads = useQuery(api.messages.listThreads);
  const deleteThread = useMutation(api.threads.deleteThread);
  const [query, setQuery] = useState("");
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ThreadSummary | null>(null);

  const filtered = useMemo(() => {
    const list = threads ?? [];
    const needle = query.trim().toLowerCase();
    if (needle === "") return list;
    return list.filter((thread) => thread.title.toLowerCase().includes(needle));
  }, [threads, query]);

  async function confirmDelete() {
    if (pendingDelete === null) return;
    try {
      await deleteThread({ threadKey: pendingDelete.threadKey });
      toast.success("Chat deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this chat. Try again."));
    } finally {
      setPendingDelete(null);
    }
  }

  const newChat = () => router.push(`/ask?chat=chat-${crypto.randomUUID()}`);
  const columns: DataTableColumn<ThreadSummary>[] = [
    {
      id: "title",
      header: "Chat",
      kind: "primary",
      cell: (thread) => (
        <ChatTitle
          thread={thread}
          isRenaming={renamingKey === thread.threadKey}
          onStopRename={() => setRenamingKey(null)}
        />
      ),
    },
    {
      id: "updated",
      header: "Updated",
      className: "w-44",
      cell: (thread) => (
        <RelativeTime iso={thread.lastMessageAt} className="font-mono text-xs tabular-nums text-fg-secondary" />
      ),
    },
    {
      id: "menu",
      header: "Actions",
      kind: "action",
      cell: (thread) => (
        <ChatMenu
          thread={thread}
          onRename={() => setRenamingKey(thread.threadKey)}
          onDelete={() => setPendingDelete(thread)}
        />
      ),
    },
  ];
  const loading = threads === undefined;
  const total = threads?.length ?? 0;

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={loading ? "Chats" : `Chats · ${total}`}
        title="Chat history"
        sub="Every conversation, newest activity first. Search by title to jump back in."
        actions={<PillButton onClick={newChat}>New chat</PillButton>}
      />
      <div className="flex flex-col gap-4">
        {total > 0 ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-tertiary" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chats"
              className="h-10 rounded-full pl-9"
              aria-label="Search chats"
            />
          </div>
        ) : null}
        <DataTable
          label="Chats"
          columns={columns}
          rows={filtered}
          rowKey={(thread) => thread.threadKey}
          loading={loading}
          onRowClick={(thread) =>
            renamingKey === null && router.push(`/ask?chat=${encodeURIComponent(thread.threadKey)}`)
          }
          empty={
            total === 0
              ? {
                  title: "No chats yet.",
                  description: "Ask Drishti anything about your tracked brands and the conversation will show up here.",
                  action: <PillButton size="sm" onClick={newChat}>New chat</PillButton>,
                }
              : {
                  title: "No chats match.",
                  description: `Nothing titled like "${query.trim()}". Try a different word.`,
                }
          }
        />
      </div>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Its messages and answer steps are removed for good. Boards keep any evidence you saved from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError && typeof error.data === "string") return error.data;
  return fallback;
}

function ChatTitle({
  thread,
  isRenaming,
  onStopRename,
}: {
  thread: ThreadSummary;
  isRenaming: boolean;
  onStopRename: () => void;
}) {
  if (!isRenaming) {
    return <span className="block truncate text-[15px] font-medium tracking-[-0.01em] text-fg">{thread.title}</span>;
  }
  return <RenameField thread={thread} onStopRename={onStopRename} />;
}

function RenameField({ thread, onStopRename }: { thread: ThreadSummary; onStopRename: () => void }) {
  const renameThread = useMutation(api.threads.renameThread);
  const [draft, setDraft] = useState(thread.title);
  const [error, setError] = useState<string | null>(null);
  const finished = useRef(false);

  async function save() {
    if (finished.current) return;
    if (draft.trim().replace(/\s+/g, " ") === thread.title) {
      finished.current = true;
      onStopRename();
      return;
    }
    try {
      await renameThread({ threadKey: thread.threadKey, title: draft });
      finished.current = true;
      onStopRename();
      toast.success("Chat renamed");
    } catch (err) {
      setError(errorMessage(err, "Could not rename this chat. Try again."));
    }
  }

  return (
    <span className="block min-w-0">
      <Input
        autoFocus
        value={draft}
        aria-label="Chat name"
        aria-invalid={error !== null}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onBlur={() => void save()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void save();
          } else if (event.key === "Escape") {
            event.preventDefault();
            finished.current = true;
            onStopRename();
          }
        }}
        className="h-8 text-[14px] font-medium"
      />
      {error !== null ? (
        <span role="alert" className="mt-1 block text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}

function ChatMenu({
  thread,
  onRename,
  onDelete,
}: {
  thread: ThreadSummary;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Chat options for ${thread.title}`}>
          <MoreHorizontal aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={(event) => event.preventDefault()}>
        <DropdownMenuItem onSelect={onRename}>
          <Pencil aria-hidden className="size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 aria-hidden className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
