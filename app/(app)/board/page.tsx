import type { Metadata } from "next";
import { BoardView } from "@/components/drishti/board/BoardView";

export const metadata: Metadata = {
  title: "Signal board",
};

function firstString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (Array.isArray(value)) return firstString(value[0]);
  return null;
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <BoardView cohortKey={firstString(params.cohort)} />;
}
