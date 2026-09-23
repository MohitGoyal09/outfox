"use client";


import { useMemo } from "react";
import { useAuthToken, useConvexAuth } from "@convex-dev/auth/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";

export function useAgentChat(scope: { brandIds: string[]; cohortKey: string; chatId?: string }) {
  const token = useAuthToken();
  const { isLoading } = useConvexAuth();
  const chatId = scope.chatId ?? "";
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { brandIds: scope.brandIds, cohortKey: scope.cohortKey, chatId },
        headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    [scope.brandIds, scope.cohortKey, chatId, token],
  );
  const chat = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const busy = chat.status === "submitted" || chat.status === "streaming";
  return { ...chat, busy, authReady: !isLoading };
}
