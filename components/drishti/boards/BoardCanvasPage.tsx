"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Id } from "@/convex/_generated/dataModel";
import { BoardSwitcher } from "./BoardSwitcher";
import { BoardCanvas, useFlowCanvas } from "./BoardCanvas";
import { BoardCanvasList } from "./BoardCanvasList";

export function BoardCanvasPage({ boardId }: { boardId: Id<"boards"> }) {
  const isPhone = useIsMobile();
  const router = useRouter();
  const boards = useQuery(api.boards.listBoards);
  const gone = boards !== undefined && !boards.some((b) => b._id === boardId);
  const flow = useFlowCanvas(boardId, gone);

  useEffect(() => {
    if (gone) router.replace("/boards");
  }, [gone, router]);

  if (gone) {
    return (
      <SkeletonRegion label="Opening your board" className="grid h-64 place-items-center">
        <Skeleton variant="block" height={160} width={280} />
      </SkeletonRegion>
    );
  }

  if (isPhone) {
    return (
      <div className="flex flex-col gap-5">
        {flow ? (
          <>
            <h1 className="type-display sr-only">{flow.canvas.name}</h1>
            <div className="w-fit rounded-md border border-border bg-bg-raised p-1 shadow-sm">
              <BoardSwitcher boardId={boardId} name={flow.canvas.name} />
            </div>
            <BoardCanvasList canvas={flow.canvas} />
          </>
        ) : (
          <p role="status" className="text-[13px] text-fg-secondary">Loading the board…</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative -mx-4 -mb-32 -mt-6 h-[calc(100dvh-4rem)] sm:-mx-6 sm:-mt-8 lg:-mx-8 lg:-mt-10">
      <BoardCanvas boardId={boardId} />
    </div>
  );
}
