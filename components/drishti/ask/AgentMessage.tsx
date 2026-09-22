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
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  answerProvenanceOf,
  approvalPartsOf,
  citationSourcesOf,
  textOf,
  toolCallCardsOf,
  untrackedBrandMentionOf,
} from "./agentChat-model";
import { AnswerMarkdown } from "./AnswerMarkdown";
import type { ToolCallCardView } from "./ask-model";
import { StepTrace } from "./StepTrace";
import { TrackBrandChip } from "./TrackBrandChip";
import { UnavailableBlock } from "./UnavailableBlock";

export function AgentMessage({
  message,
  onRespondToApproval,
  persistedCards,
}: {
  message: UIMessage;
  onRespondToApproval: (approvalId: string, approved: boolean) => void;
  persistedCards?: ToolCallCardView[];
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

  const cards = persistedCards ?? toolCallCardsOf(message as unknown as { parts?: unknown });
  const approvals = approvalPartsOf(message as unknown as { parts?: unknown });
  const provenance = answerProvenanceOf([message as unknown as { parts?: unknown }]);
  const failedCards = cards.filter((card) => card.status === "failed");
  const citationSources = citationSourcesOf([message as unknown as { parts?: unknown }]);
  const untrackedBrand = untrackedBrandMentionOf(message as unknown as { parts?: unknown });

  return (
    <Message from="assistant">
      <MessageContent>
        <StepTrace cards={cards} isRunning={text === ""} isLive={persistedCards === undefined} />

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

        {text !== "" ? (
          <UnavailableBlock
            failedSteps={failedCards}
            noGroundedEvidence={provenance?.mode === "template"}
          />
        ) : null}

        {text !== "" ? <AnswerMarkdown text={text} citationSources={citationSources} /> : null}

        {untrackedBrand !== null ? (
          <div className="mt-1">
            <TrackBrandChip brandName={untrackedBrand.name} />
          </div>
        ) : null}
      </MessageContent>
    </Message>
  );
}
