"use client";


import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { needsDefaultBoard, newestBoard } from "./boards-model";

export function BoardsPageView() {
  const router = useRouter();
  const boards = useQuery(api.boards.listBoards);
  const ensureDefaultBoard = useMutation(api.boards.ensureDefaultBoard);
  const asked = useRef(false);

  useEffect(() => {
    if (boards === undefined) return;
    const target = newestBoard(boards);
    if (target) {
      router.replace(`/boards/${target._id}`);
    } else if (needsDefaultBoard(boards) && !asked.current) {
      asked.current = true;
      void ensureDefaultBoard()
        .then((id) => router.replace(`/boards/${id}`))
        .catch(() => {
          asked.current = false;
        });
    }
  }, [boards, router, ensureDefaultBoard]);

  return (
    <SkeletonRegion label="Opening your board" className="grid h-64 place-items-center">
      <Skeleton variant="block" height={160} width={280} />
    </SkeletonRegion>
  );
}
