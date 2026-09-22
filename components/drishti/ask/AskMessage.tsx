"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "../Button";
import { formatLatency, iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import { AskReasoning } from "./AskReasoning";
import { CitationCard } from "./CitationCard";
import {
  buildFollowUpSuggestions,
  citationViews,
  type AskClaimView,
  type AskTagView,
  type AskTurn,
} from "./ask-model";

function citationDomId(turnId: string, citationId: string): string {
  return `citation-${turnId}-${citationId}`;
}

function AskAnswerContent({
  turn,
  claimIndex,
  snapshotIndex,
  tagIndex,
  onRetry,
  retrying,
  focusedCitationId,
  onFocusCitation,
}: {
  turn: AskTurn;
  claimIndex: Map<string, AskClaimView>;
  snapshotIndex: Map<string, Doc<"snapshots">>;
  tagIndex: Map<string, AskTagView>;
  onRetry: (question: string) => void;
  retrying: boolean;
  focusedCitationId: string | null;
  onFocusCitation: (turnId: string, citationId: string) => void;
}) {
  const { result } = turn;
  const retryButton = (
    <Button
      variant="ghost"
      size="sm"
      loading={retrying}
      onClick={() => onRetry(turn.question)}
      icon={<RefreshCw {...iconProps} size={14} />}
    >
      Retry
    </Button>
  );

  if (result.available === false) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col gap-1.5 text-fg-secondary">
          <p className="font-medium text-fg">Ask needs a model key.</p>
          <p>
            {result.message ??
              "No model gateway key is configured on this deployment, so no answer was generated."}
          </p>
          <p>
            Stored claims are still readable elsewhere. Ask never invents an
            answer to fill the gap.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (result.mode === "empty") {
    const refreshFailed = result.liveRefresh?.error !== undefined;
    return (
      <Alert>
        <AlertDescription className="flex flex-col gap-2 text-fg-secondary">
          <p className="font-medium text-fg">
            The stored claims do not cover these brands yet.
          </p>
          <p>
            {result.message ??
              result.answer ??
              "No stored claims cover these brands yet."}
          </p>
          {result.liveRefresh?.attempted === true ? (
            <p className="text-[11px] text-fg-tertiary">
              {refreshFailed
                ? `A live refresh ran automatically and failed: ${result.liveRefresh.error}`
                : "A live refresh ran automatically and found nothing new."}
            </p>
          ) : turn.brandCount === 0 ? (
            <p className="text-[11px] text-fg-tertiary">
              No brands are in scope, so no live refresh could run.
            </p>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  if (result.mode === "invalid" || (result.mode !== "error" && result.answer.trim() === "")) {
    return (
      <Alert>
        <AlertDescription className="flex flex-col gap-2 text-fg-secondary">
          <p className="font-medium text-fg">
            The stored claims do not answer this question.
          </p>
          <p>
            No sentence survived the citation check, so no answer is stated. Ask
            only answers from stored claims, and it drops any sentence that does
            not cite one.
          </p>
          {result.error ? (
            <p className="text-[11px] text-fg-tertiary">{result.error}</p>
          ) : null}
          <div>{retryButton}</div>
        </AlertDescription>
      </Alert>
    );
  }

  if (result.mode === "error") {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col gap-2 text-fg-secondary">
          <p className="font-medium text-fg">The answer could not be generated.</p>
          <p>{result.error ?? result.message ?? "The model call failed."}</p>
          <div>{retryButton}</div>
        </AlertDescription>
      </Alert>
    );
  }

  const citations = citationViews(result.citations, claimIndex, snapshotIndex, tagIndex);
  const followUps = buildFollowUpSuggestions(
    [...new Set(citations.map((c) => c.brandName).filter((name) => name !== ""))],
    [...new Set(citations.map((c) => c.sourceEngine).filter((engine) => engine !== ""))],
  );

  return (
    <>
      <MessageResponse>{result.answer}</MessageResponse>

      {citations.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {citations.map((citation) => (
              <button
                key={citation.id}
                type="button"
                onClick={() => onFocusCitation(turn.id, citation.id)}
                aria-label={`Jump to source ${citation.label}`}
                className={cn(
                  "inline-flex h-5 items-center rounded-full border px-1.5 font-mono text-[10.5px] font-semibold",
                  focusedCitationId === citation.id
                    ? "border-accent bg-accent-dim text-fg"
                    : "border-border-strong text-fg-tertiary hover:border-accent/50 hover:text-fg",
                )}
              >
                {citation.label}
              </button>
            ))}
          </div>
          <div className="flex flex-row flex-wrap items-start gap-1.5">
            {citations.map((citation) => (
              <CitationCard
                key={citation.id}
                citation={citation}
                id={citationDomId(turn.id, citation.id)}
                focused={focusedCitationId === citation.id}
              />
            ))}
          </div>
        </>
      ) : null}

      {followUps.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {followUps.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onRetry(question)}
              disabled={retrying}
              className="rounded-full border border-border bg-bg-raised px-2.5 py-1 text-[11.5px] text-fg-secondary transition-colors duration-150 ease-out hover:border-accent/50 hover:bg-accent-dim hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (text.trim() === "") return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      icon={
        copied ? (
          <Check {...iconProps} size={13} className="text-ok" />
        ) : (
          <Copy {...iconProps} size={13} />
        )
      }
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function AskMessage({
  turn,
  claimIndex,
  snapshotIndex,
  tagIndex,
  onRetry,
  retrying,
  focusedCitationId,
  onFocusCitation,
}: {
  turn: AskTurn;
  claimIndex: Map<string, AskClaimView>;
  snapshotIndex: Map<string, Doc<"snapshots">>;
  tagIndex: Map<string, AskTagView>;
  onRetry: (question: string) => void;
  retrying: boolean;
  focusedCitationId: string | null;
  onFocusCitation: (turnId: string, citationId: string) => void;
}) {
  const latency = formatLatency(turn.durationMs);

  return (
    <>
      <Message from="user">
        <MessageContent className="rounded-[8px] bg-bg-inset px-4 py-3 text-fg">
          {turn.question}
        </MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] text-fg-tertiary">
              {formatStamp(turn.answeredAt)}
              {latency ? ` · ${latency}` : ""}
            </span>
            <div className="flex items-center gap-1">
              <CopyButton text={turn.result.mode === "llm" ? turn.result.answer : ""} />
            </div>
          </div>

          <AskReasoning events={turn.events} />

          <AskAnswerContent
            turn={turn}
            claimIndex={claimIndex}
            snapshotIndex={snapshotIndex}
            tagIndex={tagIndex}
            onRetry={onRetry}
            retrying={retrying}
            focusedCitationId={focusedCitationId}
            onFocusCitation={onFocusCitation}
          />
        </MessageContent>
      </Message>
    </>
  );
}
