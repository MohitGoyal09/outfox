"use client";

import { ExternalLink } from "lucide-react";

import {
  Chip,
  EmptyState,
  LABEL_CLASS,
  Skeleton,
  SkeletonRegion,
  TONE_COLOR,
  VALUE_CLASS,
  iconProps,
  type Tone,
} from "@/components/drishti";
import { cn } from "@/lib/utils";
import type { BriefComposition, BriefSegment, RawClaimLine } from "./types";

export type BriefViewProps = {
  composition: BriefComposition;
  claimText: Map<string, string>;
  focusedStepId?: string | null;
  onCite: (ids: string[]) => void;
  loading?: boolean;
  className?: string;
};

const MODE_CHIP: Record<"llm" | "template", { label: string; tone: Tone }> = {
  llm: { label: "cited brief", tone: "ok" },
  template: { label: "raw claims", tone: "warn" },
};

function CitationChips({
  segment,
  claimText,
  focusedStepId,
  onCite,
}: {
  segment: Extract<BriefSegment, { kind: "cite" }>;
  claimText: Map<string, string>;
  focusedStepId: string | null;
  onCite: (ids: string[]) => void;
}) {
  return (
    <>
      {segment.ids.map((id, index) => {
        const number = segment.numbers[index] ?? 0;
        const text = claimText.get(id);
        if (text === undefined) {
          return (
            <span
              key={id}
              title="This citation does not resolve to a claim stored in this run."
              className={cn(
                VALUE_CLASS,
                "mx-0.5 text-[11px] text-[var(--text-tertiary)]",
              )}
            >
              [{number > 0 ? number : id.slice(0, 6)}]
            </span>
          );
        }
        return (
          <Chip
            key={id}
            label={`[${number}]`}
            title={text}
            pressed={focusedStepId === id}
            onClick={() => onCite([id])}
            className="mx-0.5 align-[-4px]"
          />
        );
      })}
    </>
  );
}

function RawClaimRow({ line }: { line: RawClaimLine }) {
  return (
    <li className="border-t border-[var(--border)] pt-2.5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {line.brandName === "" ? null : (
          <span className={cn(LABEL_CLASS, "text-[var(--text-secondary)]")}>
            {line.brandName}
          </span>
        )}
        {line.metric === "" ? null : (
          <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
            {line.metric}
          </span>
        )}
        {line.value === null ? null : (
          <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-primary)]")}>
            {line.value}
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] leading-[1.5] text-[var(--text-secondary)]">
        {line.text}
      </p>
      {line.href === null ? null : (
        <a
          href={line.href}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-[var(--text-primary)] underline decoration-[var(--border-strong)] hover:decoration-[var(--accent)]"
        >
          Open source
          <ExternalLink {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </li>
  );
}

export function BriefView({
  composition,
  claimText,
  focusedStepId = null,
  onCite,
  loading = false,
  className,
}: BriefViewProps) {
  if (loading) {
    return (
      <SkeletonRegion label="Loading the brief" className={className}>
        <div className="flex flex-col gap-2.5">
          <Skeleton variant="text" lines={3} />
          <Skeleton variant="text" width="68%" />
        </div>
      </SkeletonRegion>
    );
  }

  if (composition.kind === "empty") {
    return (
      <div className={className}>
        <EmptyState
          size="sm"
          title="No brief for this run."
          description="The brief is written after a run's claims are stored. This run has none, so the trail is the whole record."
        />
      </div>
    );
  }

  const chip = MODE_CHIP[composition.mode === "template" ? "template" : "llm"];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={chip.tone} label={chip.label} />
        <span className="text-[12px] leading-[1.45] text-[var(--text-tertiary)]">
          {composition.mode === "template"
            ? "Stored verbatim from the run's claims."
            : "Each sentence cites the claim ids it rests on."}
        </span>
      </div>

      {composition.notice === null ? null : (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]"
        >
          <span
            aria-hidden="true"
            className="mt-1.5 size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: TONE_COLOR.warn }}
          />
          <span>{composition.notice}</span>
        </p>
      )}

      {composition.kind === "llm" ? (
        <div className="mt-3 flex flex-col gap-3">
          {composition.paragraphs.map((segments, index) => (
            <p
              key={index}
              className="type-body measure-prose text-[var(--text-secondary)]"
            >
              {segments.map((segment, segmentIndex) =>
                segment.kind === "text" ? (
                  <span key={segmentIndex}>{segment.text} </span>
                ) : (
                  <CitationChips
                    key={segmentIndex}
                    segment={segment}
                    claimText={claimText}
                    focusedStepId={focusedStepId}
                    onCite={onCite}
                  />
                ),
              )}
            </p>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {composition.sections.map((section) => (
            <section key={section.heading} aria-label={section.heading}>
              <p className="type-headline text-[var(--text-primary)]">
                {section.heading}
              </p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {section.lines.map((line, index) => (
                  <RawClaimRow key={`${section.heading}:${index}`} line={line} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {composition.unavailable.length === 0 ? null : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {composition.unavailable.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: TONE_COLOR.weak }}
              />
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                {line}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
