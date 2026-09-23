"use client";

import { ArrowUpRight, LayoutGrid, MessageSquare } from "lucide-react";
import Link from "next/link";

import { EmptyState, Panel, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { SectionLabel } from "./SectionLabel";
import { relativeTime, threadHref, type BoardLike, type ThreadLike } from "./overview-model";

export type PickUpWhereYouLeftOffProps = {
  loading: boolean;
  threads: readonly ThreadLike[];
  boards: readonly BoardLike[];
  nowMs: number;
};

function ListSkeleton() {
  return (
    <SkeletonRegion label="Loading recent activity">
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} variant="row" height={36} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function PickUpWhereYouLeftOff({ loading, threads, boards, nowMs }: PickUpWhereYouLeftOffProps) {
  return (
    <section aria-label="Pick up where you left off" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel as="div" interactive={false} padded ariaLabel="Recent chats">
        <SectionLabel>Recent chats</SectionLabel>
        <div className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : threads.length === 0 ? (
            <EmptyState
              size="sm"
              bounded
              icon={<MessageSquare {...iconProps} size={16} aria-hidden="true" />}
              title="No chats yet"
              description="Ask Drishti a question about a tracked brand, and the conversation appears here so you can pick it back up."
              action={
                <Link
                  href="/ask"
                  className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline"
                >
                  Ask Drishti
                  <ArrowUpRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col">
              {threads.map((thread) => (
                <li key={thread.threadKey} className="border-b border-border py-2.5 first:pt-0 last:border-b-0 last:pb-0">
                  <Link
                    href={threadHref(thread.threadKey)}
                    className="flex items-center justify-between gap-3 rounded-[6px] px-1 py-1 type-body text-fg transition-colors duration-150 ease-out hover:bg-bg-inset"
                  >
                    <span className="min-w-0 truncate">{thread.title}</span>
                    <span className={cn(VALUE_CLASS, "shrink-0 text-[11px] text-fg-tertiary")}>
                      {relativeTime(thread.lastMessageAt, nowMs)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel as="div" interactive={false} padded ariaLabel="Boards">
        <SectionLabel>Boards</SectionLabel>
        <div className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : boards.length === 0 ? (
            <EmptyState
              size="sm"
              bounded
              icon={<LayoutGrid {...iconProps} size={16} aria-hidden="true" />}
              title="No boards yet"
              description="Save a piece of evidence to a board while you browse a brand, and your swipe files appear here."
              action={
                <Link href="/boards" className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline">
                  Open Boards
                  <ArrowUpRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col">
              {boards.map((board) => (
                <li key={board.id} className="border-b border-border py-2.5 first:pt-0 last:border-b-0 last:pb-0">
                  <Link
                    href="/boards"
                    className="flex items-center justify-between gap-3 rounded-[6px] px-1 py-1 type-body text-fg transition-colors duration-150 ease-out hover:bg-bg-inset"
                  >
                    <span className="min-w-0 truncate">{board.name}</span>
                    <ArrowUpRight {...iconProps} size={14} aria-hidden="true" className="size-3.5 shrink-0 text-fg-tertiary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </section>
  );
}
