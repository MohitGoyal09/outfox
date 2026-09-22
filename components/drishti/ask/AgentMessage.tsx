"use client";


import type { UIMessage } from "ai";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS } from "../tokens";
import { approvalPartsOf, textOf, toolCallCardsOf } from "./agentChat-model";
import { ToolCallCard } from "./ToolCallCard";

export function AgentMessage({
  message,
  onRespondToApproval,
}: {
  message: UIMessage;
  onRespondToApproval: (approvalId: string, approved: boolean) => void;
}) {
  const text = textOf(message as unknown as { parts?: unknown });

  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent className="rounded-[8px] bg-bg-inset px-4 py-3 text-fg">
          {text}
        </MessageContent>
      </Message>
    );
  }

  const cards = toolCallCardsOf(message as unknown as { parts?: unknown });
  const approvals = approvalPartsOf(message as unknown as { parts?: unknown });

  return (
    <Message from="assistant">
      <MessageContent>
        {cards.length === 1 ? (
          <ul className="flex flex-col rounded-[8px] border border-border bg-bg-inset px-3 py-2.5">
            <ToolCallCard card={cards[0]} />
          </ul>
        ) : cards.length > 1 ? (
          <details className="rounded-[8px] border border-border bg-bg-inset">
            <summary
              className={cn(
                LABEL_CLASS,
                "cursor-pointer select-none px-3 py-2 text-fg-tertiary hover:text-fg-secondary",
                STATE_TRANSITION_CLASS,
              )}
            >
              {cards.length} actions completed
            </summary>
            <ul className="flex flex-col border-t border-border px-3 pt-3">
              {cards.map((card) => (
                <ToolCallCard key={card.id} card={card} />
              ))}
            </ul>
          </details>
        ) : null}

        {approvals.map((part) => (
          <Confirmation
            key={part.toolCallId}
            approval={part.approval}
            state="approval-requested"
          >
            <ConfirmationTitle>
              {part.toolName} needs your approval
              {part.toolName.includes("refresh") ? " before any live fetch runs" : ""}.
            </ConfirmationTitle>
            <ConfirmationRequest>
              <p className="text-sm text-muted-foreground">
                Approve once to let this step run
                {part.toolName.includes("refresh") ? " a single live refresh" : ""}.
              </p>
            </ConfirmationRequest>
            <ConfirmationActions>
              <ConfirmationAction
                variant="outline"
                onClick={() => part.approval && onRespondToApproval(part.approval.id, false)}
              >
                Deny
              </ConfirmationAction>
              <ConfirmationAction
                onClick={() => part.approval && onRespondToApproval(part.approval.id, true)}
              >
                Accept
              </ConfirmationAction>
            </ConfirmationActions>
            <ConfirmationAccepted>
              <p className="text-sm text-muted-foreground">
                Approved. The agent runs this refresh once.
              </p>
            </ConfirmationAccepted>
            <ConfirmationRejected>
              <p className="text-sm text-muted-foreground">
                Denied. The agent continues on stored data.
              </p>
            </ConfirmationRejected>
          </Confirmation>
        ))}

        {text !== "" ? <MessageResponse>{text}</MessageResponse> : null}
      </MessageContent>
    </Message>
  );
}
