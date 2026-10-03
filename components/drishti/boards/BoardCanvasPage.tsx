"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Id } from "@/convex/_generated/dataModel";
import { iconProps } from "../tokens";
import { BoardCanvas, useFlowCanvas } from "./BoardCanvas";
import { BoardCanvasList } from "./BoardCanvasList";

export function BoardCanvasPage({ boardId }: { boardId: Id<"boards"> }) {
  const isPhone = useIsMobile();
  const flow = useFlowCanvas(boardId);

  if (isPhone) {
    return (
      <div className="flex flex-col gap-5">
        <Link href="/boards" className="focus-ring inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-[13px] text-fg-secondary">
          <ArrowLeft {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
          Boards
        </Link>
        {flow ? (
          <>
            <h1 className="type-display text-fg">{flow.canvas.name}</h1>
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
