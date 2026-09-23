import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { BoardsPageView } from "@/components/drishti/boards/BoardsPageView";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";

export const metadata: Metadata = {
  title: "Boards",
};

export default function BoardsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-border pb-7">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-accent">
          <Bookmark className="size-3.5" />
          Swipe file
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Boards</h1>
          <p className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground">
            Evidence you saved on purpose. Every card here keeps its source: what it says, where it came
            from, and when it was fetched.
          </p>
        </div>
      </header>
      <QueryBoundary label="Your boards">
        <BoardsPageView />
      </QueryBoundary>
    </div>
  );
}
