"use client";


import { useMemo } from "react";
import { useAuthToken, useConvexAuth } from "@convex-dev/auth/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function useAgentChat(scope: { brandIds: string[]; cohortKey: string }) {
  const token = useAuthToken();
  const { isLoading } = useConvexAuth();
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { brandIds: scope.brandIds, cohortKey: scope.cohortKey },
        headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    [scope.brandIds, scope.cohortKey, token],
  );
  const chat = useChat({ transport });
  const busy = chat.status === "submitted" || chat.status === "streaming";
  return { ...chat, busy, authReady: !isLoading };
}
