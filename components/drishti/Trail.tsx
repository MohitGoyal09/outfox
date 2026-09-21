"use client";


import { useEffect, useRef, type Ref } from "react";
import { ExternalLink, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";
import {
  ABSENT,
  FOCUS_MARK_CLASS,
  LABEL_CLASS,
  PRESS_CLASS,
  STATE_TRANSITION_CLASS,
  TONE_COLOR,
  VALUE_CLASS,
  formatLatency,
  iconProps,
  isValidEvidenceHref,
  type Tone,
} from "./tokens";

export type TrailDensity = "inline" | "vertical";

export type TrailStep = {
  id: string;
  label: string;
  value: string | number | null;
  reasoning?: string;
  tone?: Tone;
  href?: string;
  meta?: { at?: string; latencyMs?: number };
};

export type TrailGap = {
  id: string;
  label: string;
  reason: string;
};

export type TrailProps = {
  steps: TrailStep[];
  density: TrailDensity;
  focusedId?: string | null;
  onStepFocus?: (id: string) => void;
  loading?: boolean;
  gaps?: TrailGap[];
  emptyLabel?: string;
  className?: string;
};


export const TRAIL_ABSENT = ABSENT;

export const TRAIL_EMPTY_LABEL = "No evidence recorded for this selection.";

export function trailRailVisible(stepCount: number): boolean {
  return stepCount > 1;
}

export function trailValueText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return TRAIL_ABSENT;
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : TRAIL_ABSENT;
  }
  return value.trim().length === 0 ? TRAIL_ABSENT : value;
}

export function trailLatencyText(ms: number | null | undefined): string | null {
  return formatLatency(ms);
}

export type TrailRow = {
  id: string;
  label: string;
  valueText: string;
  tone: Tone;
  dotColor: string;
  href: string | null;
  reasoning: string | null;
  at: string | null;
  latency: string | null;
  focused: boolean;
};

export function deriveTrailRows(
  steps: TrailStep[],
  focusedId?: string | null,
): TrailRow[] {
  return steps.map((step) => {
    const tone: Tone = step.tone ?? "neutral";
    const href = isValidEvidenceHref(step.href) ? step.href.trim() : null;
    return {
      id: step.id,
      label: step.label,
      valueText: trailValueText(step.value),
      tone,
      dotColor: TONE_COLOR[tone],
      href,
      reasoning: step.reasoning ?? null,
      at: step.meta?.at ?? null,
      latency: trailLatencyText(step.meta?.latencyMs),
      focused: focusedId !== null && focusedId !== undefined && focusedId === step.id,
    };
  });
}

export type TrailRowView = {
  id: string;
  label: string;
  valueText: string;
  tone: Tone;
  dotColor: string;
  href: string | null;
  at: string | null;
  latency: string | null;
  reasoning: string | null;
  reasoningVisible: boolean;
  focused: boolean;
};

export function trailRowView(row: TrailRow, density: TrailDensity): TrailRowView {
  const vertical = density === "vertical";
  return {
    id: row.id,
    label: row.label,
    valueText: row.valueText,
    tone: row.tone,
    dotColor: row.dotColor,
    href: row.href,
    at: row.at,
    latency: row.latency,
    reasoning: vertical ? row.reasoning : null,
    reasoningVisible: vertical,
    focused: row.focused,
  };
}

export const TRAIL_SKELETON_HEIGHT: Record<TrailDensity, number> = {
  inline: 26,
  vertical: 68,
};

export function trailSkeletonLayout(
  density: TrailDensity,
  stepCount: number,
): { count: number; height: number } {
  return {
    count: stepCount > 0 ? stepCount : 4,
    height: TRAIL_SKELETON_HEIGHT[density],
  };
}


function StepDot({ view, size = "sm" }: { view: TrailRowView; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cn("shrink-0 rounded-full", size === "sm" ? "size-1.5" : "size-2")}
      style={{ backgroundColor: view.dotColor }}
    />
  );
}

function StepLabel({
  view,
  onStepFocus,
}: {
  view: TrailRowView;
  onStepFocus?: (id: string) => void;
}) {
  const base = cn(
    LABEL_CLASS,
    "min-w-0 text-left text-[var(--text-secondary,#9797a3)]",
  );
  if (!onStepFocus) {
    return <span className={cn(base, "break-words")}>{view.label}</span>;
  }
  return (
    <button
      type="button"
      onClick={() => onStepFocus(view.id)}
      className={cn(
        base,
        "-mx-1 rounded-[3px] px-1 hover:text-[var(--text-primary,#eeeef2)]",
        PRESS_CLASS,
        STATE_TRANSITION_CLASS,
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)] focus-visible:ring-[3px] focus-visible:ring-[rgba(226,163,57,0.22)]",
      )}
    >
      {view.label}
    </button>
  );
}

function StepValue({ view }: { view: TrailRowView }) {
  const textClass = cn(
    VALUE_CLASS,
    "text-[12.5px] leading-[1.45] text-[var(--text-primary,#eeeef2)]",
    "[overflow-wrap:anywhere]",
  );
  if (!view.href) {
    return <span className={textClass}>{view.valueText}</span>;
  }
  return (
    <a
      href={view.href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "group inline text-[var(--text-primary,#eeeef2)] underline decoration-[var(--border-strong,#35353f)] underline-offset-[3px] hover:decoration-[var(--accent,#e2a339)]",
        "rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)] focus-visible:ring-[3px] focus-visible:ring-[rgba(226,163,57,0.22)]",
      )}
    >
      <span className={textClass}>{view.valueText}</span>
      <ExternalLink
        {...iconProps}
        size={14}
        aria-hidden="true"
        className="ml-1 inline-block size-3.5 align-[-2px] text-[var(--text-tertiary,#64646f)] group-hover:text-[var(--accent,#e2a339)]"
      />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function StepMeta({ view }: { view: TrailRowView }) {
  if (!view.latency && !view.at) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
      {view.latency ? (
        <span className={cn(VALUE_CLASS, "text-[10.5px] text-[var(--text-tertiary,#64646f)]")}>
          {view.latency}
        </span>
      ) : null}
      {view.at ? (
        <span className={cn(VALUE_CLASS, "text-[10.5px] text-[var(--text-tertiary,#64646f)]")}>
          {view.at}
        </span>
      ) : null}
    </span>
  );
}

function TrailGaps({ gaps }: { gaps: TrailGap[] }) {
  if (gaps.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {gaps.map((gap) => (
        <li
          key={gap.id}
          data-state="gap"
          className="flex items-start gap-2 rounded-[5px] border border-dashed border-[var(--border,#24242f)] px-2 py-1.5"
        >
          <span
            aria-hidden="true"
            className="mt-1 size-1.5 shrink-0 rounded-full border border-[var(--text-tertiary,#64646f)]"
          />
          <span className="min-w-0">
            <span
              className={cn(LABEL_CLASS, "block text-[var(--text-tertiary,#64646f)]")}
            >
              {gap.label}
            </span>
            <span className="block text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
              {gap.reason}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}


export function TrailInline({
  view,
  onStepFocus,
}: {
  view: TrailRowView;
  onStepFocus?: (id: string) => void;
}) {
  return (
    <li
      aria-current={view.focused ? "true" : undefined}
      className={cn(
        "flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-[5px] px-1.5 py-1 -mx-1.5",
        STATE_TRANSITION_CLASS,
        view.focused && FOCUS_MARK_CLASS,
      )}
    >
      <StepDot view={view} />
      <StepLabel view={view} onStepFocus={onStepFocus} />
      <StepValue view={view} />
      <StepMeta view={view} />
    </li>
  );
}

export function TrailVertical({
  view,
  isLast,
  showRail,
  onStepFocus,
  itemRef,
}: {
  view: TrailRowView;
  isLast: boolean;
  showRail: boolean;
  onStepFocus?: (id: string) => void;
  itemRef?: Ref<HTMLLIElement>;
}) {
  return (
    <li
      ref={itemRef}
      aria-current={view.focused ? "true" : undefined}
      className="relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-x-3"
    >
      {showRail && !isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-[3px] top-[11px] -bottom-[27px] w-px bg-[var(--border,#24242f)]"
        />
      ) : null}
      <span aria-hidden="true" className="flex justify-center pt-[3px]">
        <StepDot view={view} size="md" />
      </span>
      <div
        className={cn(
          "min-w-0 rounded-[5px] px-2 py-1 -mx-2 -my-1",
          STATE_TRANSITION_CLASS,
          view.focused && FOCUS_MARK_CLASS,
        )}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <StepLabel view={view} onStepFocus={onStepFocus} />
          <StepValue view={view} />
        </div>
        {view.reasoningVisible && view.reasoning ? (
          <p className="mt-1.5 max-w-[68ch] text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
            {view.reasoning}
          </p>
        ) : null}
        {view.latency || view.at ? (
          <span className="mt-1 block">
            <StepMeta view={view} />
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function TrailSkeleton({
  density,
  stepCount = 0,
  className,
}: {
  density: TrailDensity;
  stepCount?: number;
  className?: string;
}) {
  const layout = trailSkeletonLayout(density, stepCount);
  return (
    <div
      data-state="loading"
      className={cn("flex flex-col gap-3", className)}
      aria-busy="true"
    >
      {Array.from({ length: layout.count }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-2"
          style={{ minHeight: `${layout.height}px` }}
        >
          <Skeleton variant="circle" />
          <span className="min-w-0 flex-1">
            <Skeleton
              variant="text"
              height={12}
              width={index % 2 === 0 ? "58%" : "44%"}
            />
          </span>
        </div>
      ))}
    </div>
  );
}


export function Trail({
  steps,
  density,
  focusedId = null,
  onStepFocus,
  loading = false,
  gaps = [],
  emptyLabel = TRAIL_EMPTY_LABEL,
  className,
}: TrailProps) {
  const focusRef = useRef<HTMLLIElement | null>(null);
  const rows = deriveTrailRows(steps, focusedId);

  useEffect(() => {
    if (!focusedId) return;
    const element = focusRef.current;
    if (!element) return;
    if (typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ block: "nearest" });
    }
  }, [focusedId, density]);

  if (loading) {
    return (
      <TrailSkeleton density={density} stepCount={steps.length} className={className} />
    );
  }

  if (rows.length === 0) {
    return (
      <div className={className} data-state="empty">
        <EmptyState
          size="sm"
          icon={<Inbox {...iconProps} size={16} />}
          title={emptyLabel}
          description="Pick a claim or a citation chip. Every step it rests on appears here, with the value each step produced."
        />
      </div>
    );
  }

  if (density === "inline") {
    return (
      <div className={className} data-state="default">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {rows.map((row) => {
            const view = trailRowView(row, "inline");
            return (
              <TrailInline
                key={row.id}
                view={view}
                onStepFocus={onStepFocus}
              />
            );
          })}
        </ul>
        {gaps.length > 0 ? (
          <div className="mt-3">
            <TrailGaps gaps={gaps} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className} data-state="default">
      <ol className="relative flex flex-col gap-6">
        {rows.map((row, index) => {
          const view = trailRowView(row, "vertical");
          const isLast = index === rows.length - 1;
          return (
            <TrailVertical
              key={row.id}
              view={view}
              isLast={isLast}
              showRail={trailRailVisible(rows.length)}
              onStepFocus={onStepFocus}
              itemRef={view.focused ? focusRef : undefined}
            />
          );
        })}
      </ol>
      {gaps.length > 0 ? (
        <div className="mt-4">
          <TrailGaps gaps={gaps} />
        </div>
      ) : null}
    </div>
  );
}
