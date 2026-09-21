import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { Trail } from "../Trail";
import { LABEL_CLASS, VALUE_CLASS, formatLatency, iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import {
  buildToolTrace,
  citationViews,
  sourceChips,
  type AskClaimView,
} from "./ask-model";
import type { AskExchange } from "./ask-store";

function Notice({
  tone,
  title,
  children,
}: {
  tone: "neutral" | "warn" | "danger";
  title: string;
  children?: React.ReactNode;
}) {
  const border =
    tone === "danger"
      ? "border-[var(--danger,#f87171)]"
      : tone === "warn"
        ? "border-[var(--border-strong,#35353f)]"
        : "border-[var(--border,#24242f)]";
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-[10px] border bg-[var(--bg-inset,#0e0e13)] p-4",
        border,
      )}
    >
      <p className="text-[13.5px] font-medium leading-[1.4] text-[var(--text-primary,#eeeef2)]">
        {title}
      </p>
      {children ? (
        <div className="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function AnswerBlock({
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
  const retry = (
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
      <Notice tone="danger" title="Ask needs a model key.">
        <p>
          {result.message ??
            "No model gateway key is configured on this deployment, so no answer was generated."}
        </p>
        <p className="mt-1">
          Stored claims are still readable elsewhere. Ask never invents an
          answer to fill the gap.
        </p>
      </Notice>
    );
  }

  if (result.mode === "empty") {
    return (
      <Notice tone="warn" title="The stored claims do not cover these brands yet.">
        <p>
          {result.message ??
            result.answer ??
            "No stored claims cover these brands yet. Run a refresh first, then ask again."}
        </p>
        {result.needsRefresh ? (
          <p className="mt-1">
            This question asks for the latest data, so it needs a fresh run
            before it can be answered.
          </p>
        ) : null}
      </Notice>
    );
  }

  if (result.mode === "invalid" || (result.mode !== "error" && result.answer.trim() === "")) {
    return (
      <Notice tone="warn" title="The stored claims do not answer this question.">
        <p>
          No sentence survived the citation check, so no answer is stated. Ask
          only answers from stored claims, and it drops any sentence that does
          not cite one.
        </p>
        {result.error ? (
          <p className={cn(VALUE_CLASS, "mt-2 text-[11px] text-[var(--text-tertiary,#64646f)]")}>
            {result.error}
          </p>
        ) : null}
        <div className="mt-3">{retry}</div>
      </Notice>
    );
  }

  if (result.mode === "error") {
    return (
      <Notice tone="danger" title="The answer could not be generated.">
        <p>{result.error ?? result.message ?? "The model call failed."}</p>
        <div className="mt-3">{retry}</div>
      </Notice>
    );
  }

  const citations = citationViews(result.citations, claimIndex);
  const sources = sourceChips(result.citations, claimIndex);

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-[68ch] text-[14px] leading-[1.55] text-[var(--text-primary,#eeeef2)]">
        {result.answer}
      </p>
      {citations.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(LABEL_CLASS, "mr-1 text-[var(--text-tertiary,#64646f)]")}>
            citations
          </span>
          {citations.map((citation) => (
            <Chip
              key={citation.id}
              label={citation.label}
              href={citation.href ?? undefined}
              title={citation.title}
            />
          ))}
        </div>
      ) : null}
      {sources.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(LABEL_CLASS, "mr-1 text-[var(--text-tertiary,#64646f)]")}>
            sources
          </span>
          {sources.map((engine) => (
            <Chip key={engine} label={engine} title={`Claim source: ${engine}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AskTranscript({
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
  const latency = formatLatency(exchange.latencyMs);
  return (
    <article className="flex flex-col gap-4 border-t border-[var(--border,#24242f)] pt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="type-headline max-w-[68ch] text-balance text-[var(--text-primary,#eeeef2)]">
          {exchange.question}
        </h2>
        <span className={cn(VALUE_CLASS, "text-[10.5px] text-[var(--text-tertiary,#64646f)]")}>
          {formatStamp(exchange.askedAt)}
          {latency ? ` · ${latency}` : ""}
        </span>
      </header>

      <section aria-label="Tool trace" className="flex flex-col gap-2">
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
          tool trace
        </span>
        <Trail
          density="vertical"
          steps={buildToolTrace(exchange.result, exchange.brandIds.length)}
        />
      </section>

      <section aria-label="Answer" className="flex flex-col gap-2">
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
          answer
        </span>
        <AnswerBlock
          exchange={exchange}
          claimIndex={claimIndex}
          onRetry={onRetry}
          retrying={retrying}
        />
      </section>
    </article>
  );
}
