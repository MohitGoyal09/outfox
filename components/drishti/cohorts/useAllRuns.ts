"use client";


import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import type { RunDoc } from "./cohorts-model";

export type AllRuns = {
  runs: RunDoc[];
  isLoading: boolean;
};

export function useAllRuns(): AllRuns {
  const running = useQuery(api.runs.listByStatus, { status: "running" });
  const complete = useQuery(api.runs.listByStatus, { status: "complete" });
  const partial = useQuery(api.runs.listByStatus, { status: "partial" });
  const failed = useQuery(api.runs.listByStatus, { status: "failed" });

  const isLoading =
    running === undefined ||
    complete === undefined ||
    partial === undefined ||
    failed === undefined;

  const runs = useMemo(
    () => [
      ...(running ?? []),
      ...(complete ?? []),
      ...(partial ?? []),
      ...(failed ?? []),
    ],
    [running, complete, partial, failed],
  );

  return { runs, isLoading };
}
