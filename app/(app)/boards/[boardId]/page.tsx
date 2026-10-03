import type { Metadata } from "next";
import { BoardCanvasPage } from "@/components/drishti/boards/BoardCanvasPage";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import type { Id } from "@/convex/_generated/dataModel";

export const metadata: Metadata = {
  title: "Board",
};

export default async function BoardCanvasRoute({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return (
    <QueryBoundary label="This board">
      <BoardCanvasPage boardId={boardId as Id<"boards">} />
    </QueryBoundary>
  );
}
