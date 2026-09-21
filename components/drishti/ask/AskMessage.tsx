"use client";

import { ChevronDownIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { Trail } from "../Trail";
import { LABEL_CLASS, iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import { formatLatency } from "../tokens";
import { buildToolTrace, citationViews, type AskClaimView } from "./ask-model";
import type { AskExchange } from "./ask-store";

function AskAnswerContent({
  exchange,
  claimIndex,
  onRetry,
  retrying,
}: {
  exchange: AskExchange;
  claimIndex: Map<string, AskClaimView>;
  onRetry: (question: string) => void;
  retrying: boolean;
}) {
  const { result } = exchange;
  const retryButton = (
    <Button
      variant="ghost"
      size="sm"
      loading={retrying}
      onClick={() => onRetry(exchange.question)}
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
          ) : exchange.brandIds.length === 0 ? (
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

  const citations = citationViews(result.citations, claimIndex);

  return (
    <>
      <MessageResponse>{result.answer}</MessageResponse>
      {citations.length > 0 ? (
        <Sources>
          <SourcesTrigger
            count={citations.length}
            className={cn(LABEL_CLASS, "text-fg-tertiary hover:text-fg-secondary")}
          >
            <span>
              {citations.length} citation{citations.length === 1 ? "" : "s"}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </SourcesTrigger>
          <SourcesContent className="flex-row flex-wrap gap-1.5">
            {citations.map((citation) => (
              <Chip
                key={citation.id}
                href={citation.href ?? undefined}
                title={citation.title}
              >
                {citation.label}
              </Chip>
            ))}
          </SourcesContent>
        </Sources>
      ) : null}
    </>
  );
}

export function AskMessage({
  exchange,
  claimIndex,
  onRetry,
  retrying,
}: {
  exchange: AskExchange;
  claimIndex: Map<string, AskClaimView>;
  onRetry: (question: string) => void;
  retrying: boolean;
}) {
  const toolTrace = buildToolTrace(exchange.result, exchange.brandIds.length);
  const latency = formatLatency(exchange.latencyMs);

  return (
    <>
      <Message from="user">
        <MessageContent className="rounded-[8px] bg-bg-inset px-4 py-3 text-fg">
          {exchange.question}
        </MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          <span className="text-[10.5px] text-fg-tertiary">
            {formatStamp(exchange.askedAt)}
            {latency ? ` · ${latency}` : ""}
          </span>

          <Sources>
            <SourcesTrigger
              count={toolTrace.length}
              className={cn(LABEL_CLASS, "text-fg-tertiary hover:text-fg-secondary")}
            >
              <span>
                {toolTrace.length} tool{toolTrace.length === 1 ? "" : "s"}
              </span>
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </SourcesTrigger>
            <SourcesContent className="rounded-[8px] border border-border bg-bg-inset p-3">
              <Trail density="vertical" steps={toolTrace} />
            </SourcesContent>
          </Sources>

          <AskAnswerContent
            exchange={exchange}
            claimIndex={claimIndex}
            onRetry={onRetry}
            retrying={retrying}
          />
        </MessageContent>
      </Message>
    </>
  );
}
