"use client";


import { useQuery } from "convex/react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button, EmptyState, Panel, Trail, iconProps, type TrailStep } from "@/components/drishti";
import { sourceName, hookName } from "@/components/drishti/labels";
import { deriveCheckTrailRows, deriveComparisonSummary, hasComparisonToShow, hasFailedSource } from "./onboarding-model";
import type { SelectedCompetitor } from "./Step2Competitors";

const SOURCES_CHECKED = "Google, YouTube, Google Trends, Google News, and Ads Transparency (where available)";

export function Step3FirstCheck({
  ownBrandId,
  ownBrandName,
  competitors,
  runId,
  startError,
  onDone,
  onBack,
}: {
  ownBrandId: string;
  ownBrandName: string;
  competitors: SelectedCompetitor[];
  runId: Id<"runs"> | null;
  startError: string | null;
  onDone: () => void;
  onBack: () => void;
}) {
  const run = useQuery(api.runs.getRun, runId !== null ? { runId } : "skip");
  const events = useQuery(api.agentEvents.eventsForRun, runId !== null ? { runId } : "skip");
  const claims = useQuery(
    api.claims.byRun,
    runId !== null && run !== null && run !== undefined && run.status !== "running" ? { runId } : "skip",
  );

  const trailRows = deriveCheckTrailRows(
    (events ?? []).map((event) => ({
      id: String(event._id),
      kind: event.kind,
      name: event.name,
      status: event.status,
      ...(event.detail !== undefined ? { detail: event.detail } : {}),
    })),
    sourceName,
  );
  const trailSteps: TrailStep[] = trailRows.map((row) => ({
    id: row.id,
    label: row.label,
    value: row.statusText,
    tone: row.status === "complete" ? "ok" : row.status === "failed" ? "danger" : row.status === "skipped" ? "weak" : "neutral",
    ...(row.detail !== undefined ? { reasoning: row.detail } : {}),
  }));

  if (startError !== null) {
    return (
      <Fail message={startError} onDone={onDone} onBack={onBack} />
    );
  }

  if (runId === null || run === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <Panel as="section" interactive={false} padded ariaLabel="Starting your check">
          <p className="text-[14px] leading-[1.5] text-[var(--text-secondary,#667085)]">Starting your first check…</p>
        </Panel>
      </div>
    );
  }

  if (run === null) {
    return <Fail message="This run could not be found." onDone={onDone} onBack={onBack} />;
  }

  if (run.status === "running") {
    return (
      <div className="flex flex-col gap-6">
        <Panel as="section" interactive={false} padded ariaLabel="Checking your brands">
          <p className="text-[14px] leading-[1.5] text-[var(--text-primary,#17191D)]">
            Checking {ownBrandName}
            {competitors.length > 0 ? ` and ${competitors.length} competitor${competitors.length === 1 ? "" : "s"}` : ""}{" "}
            against {SOURCES_CHECKED}.
          </p>
          <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--text-tertiary,#98A2B3)]">
            This can take a minute or two. You don&rsquo;t need to wait here.
          </p>
          {trailSteps.length > 0 ? (
            <div className="mt-4 border-t border-[var(--border,#E4E7EC)] pt-4">
              <Trail steps={trailSteps} density="inline" />
            </div>
          ) : null}
        </Panel>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="button" variant="ghost" onClick={onDone} iconRight={<ArrowRight {...iconProps} size={14} />}>
            Skip ahead to your homepage
          </Button>
        </div>
      </div>
    );
  }

  if (run.status === "failed") {
    return (
      <Fail
        message={run.errorMessage ?? "This check could not complete. No comparison is available."}
        onDone={onDone}
        onBack={onBack}
      />
    );
  }

  const showPartialWarning = run.status === "partial" && hasFailedSource(trailRows);
  const competitorIds = competitors.map((row) => row.id);
  const nameById = new Map<string, string>([[ownBrandId, ownBrandName], ...competitors.map((row): [string, string] => [row.id, row.name])]);
  const summary =
    claims === undefined
      ? null
      : deriveComparisonSummary({
          ownBrandId,
          competitorBrandIds: competitorIds,
          claims: claims.map((claim) => ({ brandId: String(claim.brandId), ...(claim.hookType !== undefined ? { hookType: claim.hookType } : {}) })),
        });

  const uncheckedNames = summary === null
    ? []
    : [...(summary.ownChecked ? [] : [ownBrandName]), ...summary.uncheckedCompetitorIds.map((id) => nameById.get(id) ?? "a competitor")];

  return (
    <div className="flex flex-col gap-6">
      {showPartialWarning ? (
        <p className="flex items-start gap-1.5 text-[13px] leading-[1.5] text-[var(--warn,#B45309)]">
          <TriangleAlert {...iconProps} size={14} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Some sources couldn&rsquo;t be checked this time. Here&rsquo;s what we did find.
        </p>
      ) : null}

      {trailSteps.length > 0 ? (
        <Panel as="section" interactive={false} padded ariaLabel="What we checked">
          <Trail steps={trailSteps} density="inline" />
        </Panel>
      ) : null}

      {summary === null ? (
        <Panel as="section" interactive={false} padded>
          <p className="text-[14px] text-[var(--text-secondary,#667085)]">Reading the results…</p>
        </Panel>
      ) : hasComparisonToShow(summary) ? (
        <Panel as="section" interactive={false} padded ariaLabel="Your first comparison">
          <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--text-tertiary,#98A2B3)]">
            What stood out
          </p>
          <ul className="flex flex-col gap-2.5">
            {summary.highlights.map((highlight) => (
              <li key={highlight.hookType} className="text-[14px] leading-[1.5] text-[var(--text-primary,#17191D)]">
                {highlight.competitorCount} of {highlight.checkedCompetitorCount} checked competitor
                {highlight.checkedCompetitorCount === 1 ? "" : "s"} {highlight.competitorCount === 1 ? "runs" : "run"}{" "}
                <strong className="font-semibold">{hookName(highlight.hookType).toLowerCase()}</strong> content.{" "}
                {ownBrandName} {highlight.ownHasHook ? "does too." : "doesn't yet."}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyState
          size="sm"
          title="Not enough evidence yet to compare"
          description={
            competitors.length === 0
              ? "You didn't add any competitors, so there's nothing to compare against yet. Add some anytime from Brands."
              : "Whatever we found didn't show a clear difference yet. Check back once the next run finishes."
          }
        />
      )}

      {uncheckedNames.length > 0 ? (
        <p className="text-[12.5px] leading-[1.5] text-[var(--text-tertiary,#98A2B3)]">
          Not checked yet: {uncheckedNames.join(", ")}.
        </p>
      ) : null}

      <div className="flex items-center gap-2 border-t border-[var(--border,#E4E7EC)] pt-5">
        <Button type="button" onClick={onDone} iconRight={<ArrowRight {...iconProps} size={14} />}>
          Go to your homepage
        </Button>
      </div>
    </div>
  );
}

function Fail({ message, onDone, onBack }: { message: string; onDone: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <EmptyState
        size="sm"
        icon={<TriangleAlert {...iconProps} size={16} aria-hidden="true" />}
        title="This check didn't complete"
        description={message}
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onDone} iconRight={<ArrowRight {...iconProps} size={14} />}>
          Go to your homepage
        </Button>
      </div>
    </div>
  );
}
