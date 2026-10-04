import type { Metadata } from "next";
import { BoardsPageView } from "@/components/drishti/boards/BoardsPageView";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";

export const metadata: Metadata = {
  title: "Boards",
};

export default function BoardsPage() {
  return (
    <QueryBoundary label="Your boards">
      <BoardsPageView />
    </QueryBoundary>
  );
}
