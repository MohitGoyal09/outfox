"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { ArrowRight, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { EmptyState } from "../EmptyState";
import { SkeletonRows } from "../Skeleton";
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
import { iconProps } from "../tokens";
import { RelativeTime } from "../RelativeTime";
import { groupThreadsByActivity, type ThreadSummary } from "./chat-groups";

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

  const groups = useMemo(() => groupThreadsByActivity(filtered, new Date()), [filtered]);

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

  if (threads === undefined) {
    return (
      <div className="grid gap-3">
        <SkeletonRows count={4} variant="row" height={64} />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        bounded
        icon={<MessageSquare {...iconProps} size={16} />}
        title="No chats yet."
        description="Ask Drishti anything about your tracked brands and the conversation will show up here."
        action={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(`/ask?chat=chat-${crypto.randomUUID()}`)}
          >
            <Plus className="size-3.5" aria-hidden />
            New chat
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            className="h-10 pl-9"
            aria-label="Search chats"
          />
        </div>
        <Button
          size="sm"
          className="gap-1.5 sm:h-10"
          onClick={() => router.push(`/ask?chat=chat-${crypto.randomUUID()}`)}
        >
          <Plus className="size-3.5" aria-hidden />
          New chat
        </Button>
      </div>
      <p className="font-mono text-xs tabular-nums text-muted-foreground" role="status">
        {filtered.length === threads.length
          ? `${threads.length} ${threads.length === 1 ? "chat" : "chats"}`
          : `${filtered.length} of ${threads.length} chats`}
      </p>
      {filtered.length === 0 ? (
        <EmptyState
          bounded
          icon={<Search {...iconProps} size={16} />}
          title="No chats match."
          description={`Nothing titled like "${query.trim()}". Try a different word.`}
        />
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col gap-2">
            <h2 className="text-[12px] font-medium text-fg-secondary">
              {group.label}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.threads.map((thread) => (
                <ChatRow
                  key={thread.threadKey}
                  thread={thread}
                  isRenaming={renamingKey === thread.threadKey}
                  onStartRename={() => setRenamingKey(thread.threadKey)}
                  onStopRename={() => setRenamingKey(null)}
                  onDelete={() => setPendingDelete(thread)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
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

function ChatRow({
  thread,
  isRenaming,
  onStartRename,
  onStopRename,
  onDelete,
}: {
  thread: ThreadSummary;
  isRenaming: boolean;
  onStartRename: () => void;
  onStopRename: () => void;
  onDelete: () => void;
}) {
  const renameThread = useMutation(api.threads.renameThread);
  const [draft, setDraft] = useState(thread.title);
  const [error, setError] = useState<string | null>(null);
  const finished = useRef(false);

  function begin() {
    finished.current = false;
    setDraft(thread.title);
    setError(null);
    onStartRename();
  }

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

  const rowClass = cn(
    "group relative flex min-w-0 flex-1 items-center rounded-lg border border-border bg-bg-raised shadow-xs",
    "transition-[border-color,box-shadow] duration-150 ease-out hover:border-border-strong hover:shadow-sm",
  );
  const icon = (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-inset text-fg-secondary transition-colors duration-150 ease-out group-hover:bg-bg-raised-2 group-hover:text-fg">
      <MessageSquare aria-hidden className="size-4" />
    </span>
  );

  return (
    <li className={rowClass}>
      {isRenaming ? (
        <div className="flex min-w-0 flex-1 items-center gap-3 p-4 pr-14">
          {icon}
          <span className="min-w-0 flex-1">
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
        </div>
      ) : (
        <Link
          href={`/ask?chat=${encodeURIComponent(thread.threadKey)}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-4 pr-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {icon}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-fg">{thread.title}</span>
            <RelativeTime
              iso={thread.lastMessageAt}
              className="mt-0.5 block font-mono text-[11px] tabular-nums text-muted-foreground"
            />
          </span>
          <ArrowRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
          />
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            aria-label={`Chat options for ${thread.title}`}>
            <MoreHorizontal aria-hidden className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={(event) => event.preventDefault()}>
          <DropdownMenuItem onSelect={begin}>
            <Pencil aria-hidden className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 aria-hidden className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
