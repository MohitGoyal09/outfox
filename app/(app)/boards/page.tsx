import type { Metadata } from "next";
import { BoardsPageView } from "@/components/drishti/boards/BoardsPageView";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";

export const metadata: Metadata = {
  title: "Boards",
};

export default function BoardsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <h1 className="type-display text-fg">Boards</h1>
        <p className="max-w-[68ch] type-body text-fg-secondary">
          Evidence you saved on purpose. Every card here keeps its source: what it says, where it came
          from, and when it was fetched.
        </p>
      </header>
      <QueryBoundary label="Your boards">
        <BoardsPageView />
      </QueryBoundary>
    </div>
  );
}
