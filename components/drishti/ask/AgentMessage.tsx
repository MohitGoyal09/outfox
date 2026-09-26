"use client";


import type { UIMessage } from "ai";
import { motion, useReducedMotion } from "motion/react";
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
  MessageActions,
  MessageContent,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  answerProvenanceOf,
  approvalPartsOf,
  citationSourcesOf,
  followUpsOf,
  hasStreamedThisSession,
  sourceRowsOf,
  textOf,
  toolCallCardsOf,
  untrackedBrandMentionOf,
} from "./agentChat-model";
import type { ClaimTextById } from "./agentChat-model";
import { AnswerActions, CopyAction } from "./AnswerActions";
import { AnswerMarkdown } from "./AnswerMarkdown";
import { AnswerSourcesPanel } from "./AnswerSourcesPanel";
import { persistedTrendsResultsOf, type ToolCallCardView } from "./ask-model";
import { descriptiveToolLabel, toolEngine, toolTitle } from "./ToolCallCard";
import { FollowUpList } from "./FollowUpList";
import { AnswerCharts } from "./AnswerCharts";
import { A2UISurface } from "../a2ui/A2UISurface";
import { splitA2UIBlock, surfaceResults } from "../a2ui/protocol";
import { ThoughtLine, type ThoughtStep, type ThoughtStepStatus } from "./ThoughtLine";
import { TrackBrandChip } from "./TrackBrandChip";
import { AddBrandConfirmation, addBrandProposalOf } from "./AddBrandConfirmation";
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
  claimsById,
  question = null,
  threadKey = "",
  isStreaming = false,
  isBusy = true,
  persistedCards,
  persistedDurationMs,
}: {
  message: UIMessage;
  onRespondToApproval: (approvalId: string, approved: boolean) => void;
  onOpenCitation: (claimId: string) => void;
  onSelectFollowUp: (question: string) => void;
  onRetry?: () => void;
  brandNames?: Record<string, string>;
  claimsById: ClaimTextById;
  question?: string | null;
  threadKey?: string;
  isStreaming?: boolean;
  isBusy?: boolean;
  persistedCards?: ToolCallCardView[];
  persistedDurationMs?: number | null;
}) {
  const reduceMotion = useReducedMotion();
  const messageText = textOf(message as unknown as { parts?: unknown });
  const { text, a2ui } = splitA2UIBlock(messageText);

  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent>{text}</MessageContent>
        <MessageActions className="justify-end pr-0.5">
          <CopyAction text={text} copyLabel="Copy question" copiedLabel="Copied" />
        </MessageActions>
      </Message>
    );
  }

  const streamedThisSession = hasStreamedThisSession(message as unknown as { parts?: unknown });
  const liveCards = toolCallCardsOf(message as unknown as { parts?: unknown });
  const cards = streamedThisSession ? liveCards : (persistedCards ?? liveCards);
  const persistedTrends = streamedThisSession ? [] : persistedTrendsResultsOf(persistedCards ?? []);
  const approvals = approvalPartsOf(message as unknown as { parts?: unknown });
  const provenance = answerProvenanceOf([message as unknown as { parts?: unknown }]);
  const failedCards = cards.filter((card) => card.status === "failed");
  const citationSources = citationSourcesOf([message as unknown as { parts?: unknown }]);
  const untrackedBrand = untrackedBrandMentionOf(message as unknown as { parts?: unknown });
  const sourceRows = sourceRowsOf([message as unknown as { parts?: unknown }], claimsById);
  const followUps = followUpsOf([message as unknown as { parts?: unknown }]);
  const isRunning = messageText === "";
  const isLive = streamedThisSession;

  const steps: ThoughtStep[] = cards.map((card) => ({
    id: card.id,
    text: descriptiveToolLabel(card.name, card.rawPayload, brandNames),
    status: thoughtStatusOf(card.status),
    engine: toolEngine(card.name),
  }));
  const persistedElapsedSeconds =
    !isLive && persistedDurationMs != null && persistedDurationMs > 0
      ? persistedDurationMs / 1000
      : undefined;
  const showTimer = isBusy || isLive || persistedElapsedSeconds !== undefined;
  const animateIn = !reduceMotion && (isBusy || isLive);

  return (
    <Message from="assistant">
      <MessageContent className="w-full">
        <motion.div
          className="flex w-full min-w-0 flex-col gap-2"
          initial={animateIn ? { opacity: 0, y: -8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={animateIn ? { duration: 0.18, ease: "easeOut" } : { duration: 0 }}
        >
        <ThoughtLine
          steps={steps}
          working={isRunning && isBusy}
          elapsedSeconds={persistedElapsedSeconds}
          showTimer={showTimer}
        />

        {/* Bound to the tool result, not to model text: the chart reads
            get_trends' own returned rows, so a plotted point cannot be
            fabricated. Renders nothing when no trends tool ran. */}
        <AnswerCharts
          message={message as unknown as { parts?: unknown }}
          persistedResults={persistedTrends}
        />

        {approvals.map((part) => {
          const approvalSummary = addBrandProposalOf(part);
          if (approvalSummary !== null) {
            return (
              <AddBrandConfirmation
                key={part.toolCallId}
                part={part}
                onRespondToApproval={onRespondToApproval}
                onSubmitCorrection={onSelectFollowUp}
              />
            );
          }
          return (
          <Confirmation
            key={part.toolCallId}
            approval={part.approval}
            state="approval-requested"
          >
            <ConfirmationTitle>
              {toolTitle(part.toolName)} needs your approval
              {part.toolName.includes("refresh") ? " before any live fetch happens" : ""}.
            </ConfirmationTitle>
            <ConfirmationRequest>
              <p className="text-sm text-muted-foreground">
                Approve once to let this step happen
                {part.toolName.includes("refresh") ? " as a single live refresh" : ""}.
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
                Approved. The agent performs this refresh once.
              </p>
            </ConfirmationAccepted>
            <ConfirmationRejected>
              <p className="text-sm text-muted-foreground">
                Denied. The agent continues on stored data.
              </p>
            </ConfirmationRejected>
          </Confirmation>
          );
        })}

        {messageText !== "" ? (
          <>
            <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-bg-raised p-4 shadow-[var(--shadow-xs)]">
              <UnavailableBlock
                failedSteps={failedCards}
                noGroundedEvidence={provenance?.mode === "template"}
              />

              <AnswerMarkdown
                text={text}
                citationSources={citationSources}
                isStreaming={isStreaming}
                onOpenCitation={onOpenCitation}
              />
            </div>

            <MessageToolbar className="mt-0.5">
              <AnswerActions text={text} visible={!isStreaming} onRetry={onRetry} />
              <AnswerSourcesPanel sources={sourceRows} claimsById={claimsById} question={question} threadKey={threadKey} />
            </MessageToolbar>
          </>
        ) : null}

        {a2ui !== null ? (
          <A2UISurface
            text={a2ui}
            results={surfaceResults(message as unknown as { parts?: unknown }, cards)}
          />
        ) : null}

        {untrackedBrand !== null ? (
          <div className="mt-1">
            <TrackBrandChip brandName={untrackedBrand.name} />
          </div>
        ) : null}

        {text !== "" && !isStreaming ? (
          <FollowUpList followUps={followUps} onSelect={onSelectFollowUp} />
        ) : null}
        </motion.div>
      </MessageContent>
    </Message>
  );
}
