"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowRight, MessageSquare, Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { EmptyState } from "../EmptyState";
import { SkeletonRows } from "../Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";

export function ChatsView() {
  const router = useRouter();
  const threads = useQuery(api.messages.listThreads);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = threads ?? [];
    const needle = query.trim().toLowerCase();
    if (needle === "") return list;
    return list.filter((thread) => thread.title.toLowerCase().includes(needle));
  }, [threads, query]);

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
        <ul className="flex flex-col gap-2">
          {filtered.map((thread) => (
            <li key={thread.threadKey}>
              <Link
                href={`/ask?chat=${encodeURIComponent(thread.threadKey)}`}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-border bg-bg-raised p-4 shadow-xs",
                  "transition-[border-color,box-shadow] duration-150 ease-out hover:border-border-strong hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-inset text-fg-secondary transition-colors duration-150 ease-out group-hover:bg-bg-raised-2 group-hover:text-fg">
                  <MessageSquare aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-fg">
                    {thread.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatStamp(thread.lastMessageAt).split(" · ")[0]}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
