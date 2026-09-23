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
  followUpsOf,
  hasStreamedThisSession,
  sourcesOf,
  textOf,
  toolCallCardsOf,
  untrackedBrandMentionOf,
} from "./agentChat-model";
import { AnswerActions } from "./AnswerActions";
import { AnswerMarkdown } from "./AnswerMarkdown";
import { AnswerSourcesPanel } from "./AnswerSourcesPanel";
import type { ToolCallCardView } from "./ask-model";
import { descriptiveToolLabel } from "./ToolCallCard";
import { FollowUpList } from "./FollowUpList";
import { ThoughtLine, type ThoughtStep, type ThoughtStepStatus } from "./ThoughtLine";
import { TrackBrandChip } from "./TrackBrandChip";
import { UnavailableBlock } from "./UnavailableBlock";

function thoughtStatusOf(status: ToolCallCardView["status"]): ThoughtStepStatus {
  if (status === "complete") return "complete";
  if (status === "failed") return "failed";
  return "running";
}

export function AgentMessage({
  message,
  onRespondToApproval,
  onOpenCitation,
  onSelectFollowUp,
  onRetry,
  brandNames = {},
  isStreaming = false,
  isBusy = true,
  persistedCards,
}: {
  message: UIMessage;
  onRespondToApproval: (approvalId: string, approved: boolean) => void;
  onOpenCitation: (claimId: string) => void;
  onSelectFollowUp: (question: string) => void;
  onRetry?: () => void;
  brandNames?: Record<string, string>;
  isStreaming?: boolean;
  isBusy?: boolean;
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

  const streamedThisSession = hasStreamedThisSession(message as unknown as { parts?: unknown });
  const liveCards = toolCallCardsOf(message as unknown as { parts?: unknown });
  const cards = streamedThisSession ? liveCards : (persistedCards ?? liveCards);
  const approvals = approvalPartsOf(message as unknown as { parts?: unknown });
  const provenance = answerProvenanceOf([message as unknown as { parts?: unknown }]);
  const failedCards = cards.filter((card) => card.status === "failed");
  const citationSources = citationSourcesOf([message as unknown as { parts?: unknown }]);
  const untrackedBrand = untrackedBrandMentionOf(message as unknown as { parts?: unknown });
  const sources = sourcesOf([message as unknown as { parts?: unknown }]);
  const followUps = followUpsOf([message as unknown as { parts?: unknown }]);
  const isRunning = text === "";
  const isLive = streamedThisSession;

  const steps: ThoughtStep[] = cards.map((card) => ({
    id: card.id,
    text: descriptiveToolLabel(card.name, card.rawPayload, brandNames),
    status: thoughtStatusOf(card.status),
  }));
  const persistedElapsedSeconds = !isLive
    ? cards.reduce((sum, card) => sum + (card.durationMs ?? 0), 0) / 1000
    : undefined;

  return (
    <Message from="assistant">
      <MessageContent>
        <ThoughtLine steps={steps} working={isLive && isRunning && isBusy} elapsedSeconds={persistedElapsedSeconds} />

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

        {text !== "" ? (
          <AnswerMarkdown
            text={text}
            citationSources={citationSources}
            isStreaming={isStreaming}
            onOpenCitation={onOpenCitation}
          />
        ) : null}

        {text !== "" ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AnswerSourcesPanel sources={sources} />
            <AnswerActions text={text} visible={!isStreaming} onRetry={onRetry} />
          </div>
        ) : null}

        {untrackedBrand !== null ? (
          <div className="mt-1">
            <TrackBrandChip brandName={untrackedBrand.name} />
          </div>
        ) : null}

        {text !== "" && !isStreaming ? (
          <FollowUpList followUps={followUps} onSelect={onSelectFollowUp} />
        ) : null}
      </MessageContent>
    </Message>
  );
}
