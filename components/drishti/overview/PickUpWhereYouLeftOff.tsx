"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { EmptyState, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import { RelativeTime } from "@/components/drishti/RelativeTime";
import { cn } from "@/lib/utils";

import { Card } from "./Card";
import { boardItemCountLabel, threadHref, type BoardLike, type ThreadLike } from "./overview-model";

export type PickUpWhereYouLeftOffProps = {
  loading: boolean;
  threads: readonly ThreadLike[];
  boards: readonly BoardLike[];
  newestBoardItemCount: number | null;
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

export function PickUpWhereYouLeftOff({ loading, threads, boards, newestBoardItemCount }: PickUpWhereYouLeftOffProps) {
  return (
    <section aria-label="Pick up where you left off" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card
        title="Recent chats"
      >
        {loading ? (
          <ListSkeleton />
        ) : threads.length === 0 ? (
          <EmptyState
            size="sm"
            bounded
            title="No chats yet"
            description="Ask Drishti a question about a tracked brand, and the conversation appears here so you can pick it back up."
            action={
              <Link
                href="/ask"
                className="inline-flex items-center gap-1.5 rounded-sm text-[13px] text-accent transition-colors duration-150 ease-out hover:underline"
              >
                Ask Drishti
                <ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col">
            {threads.map((thread) => (
              <li key={thread.threadKey} className="border-b border-border py-2.5 first:pt-0 last:border-b-0 last:pb-0">
                <Link
                  href={threadHref(thread.threadKey)}
                  className="flex items-center justify-between gap-3 rounded-md px-1 py-1 type-body text-fg transition-colors duration-150 ease-out hover:bg-bg-inset"
                >
                  <span className="min-w-0 truncate">{thread.title}</span>
                  <span className={cn(VALUE_CLASS, "shrink-0 text-xs text-fg-secondary")}>
                    <RelativeTime iso={thread.lastMessageAt} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Boards"
      >
        {loading ? (
          <ListSkeleton />
        ) : boards.length === 0 ? (
          <EmptyState
            size="sm"
            bounded
            title="No boards yet"
            description="Save a piece of evidence to a board while you browse a brand, and your swipe files appear here."
            action={
              <Link
                href="/boards"
                className="inline-flex items-center gap-1.5 rounded-sm text-[13px] text-accent transition-colors duration-150 ease-out hover:underline"
              >
                Open Boards
                <ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <p className="type-body truncate text-fg">{boards[0].name}</p>
              {boardItemCountLabel(newestBoardItemCount) ? (
                <p className={cn(VALUE_CLASS, "mt-0.5 text-xs text-fg-secondary")}>{boardItemCountLabel(newestBoardItemCount)}</p>
              ) : null}
            </div>
            <Link
              href={`/boards/${boards[0].id}`}
              className="inline-flex w-fit items-center gap-1.5 rounded-sm text-[13px] text-accent transition-colors duration-150 ease-out hover:underline"
            >
              Open board
              <ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        )}
      </Card>
    </section>
  );
}
