"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { checkedStateLabel, sourceName } from "@/components/drishti/labels";
import { EmptyState } from "../../EmptyState";
import { FETCH_ENGINES, type ClaimDoc, type EngineCoverageRow, type SnapshotDoc } from "../brand-model";
import { sourceColor, type FunnelStage } from "../../tokens";
import { MetricInfo } from "../../MetricInfo";
import { DeltaTag, FunnelPanel, HookChart, SummaryPanel } from "../EvidencePanels";
import { PlatformLogo } from "../PlatformLogo";
import { EvidenceSection } from "../EvidenceSection";
import type { BrandFilters } from "../filters/filters-model";
import { shortDate } from "../format";
import type { DistributionItem } from "../../DistributionPanel";

function EvidenceMix({ claims, previousClaims }: { claims: ClaimDoc[]; previousClaims: ClaimDoc[] | null }) {
  const rows = useMemo(
    () =>
      FETCH_ENGINES.map((engine) => {
        const count = claims.filter((claim) => claim.sourceEngine === engine).length;
        const delta = previousClaims ? count - previousClaims.filter((claim) => claim.sourceEngine === engine).length : null;
        return { engine, label: sourceName(engine).replace("Google ", ""), count, delta };
      }).filter((row) => row.count > 0),
    [claims, previousClaims],
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="space-y-3">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.engine} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-xs">
            <span className="flex items-center gap-2 truncate">
              <PlatformLogo engine={row.engine} className="size-3.5" />
              {row.label}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{Intl.NumberFormat("en-US").format(row.count)}</span>
            <span className="font-mono text-[11px] text-ok">{total ? `${Math.round((row.count / total) * 100)}%` : "—"}</span>
            <DeltaTag delta={row.delta} />
          </div>
        ))
      ) : (
        <EmptyState
          size="sm"
          icon={<PlatformLogo engine="google" className="size-4" />}
          title="No evidence mix for this check."
          description="This breaks the latest check's findings down by source. It fills in once an engine returns at least one finding."
        />
      )}
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {rows.map((row) => (
          <span
            key={row.engine}
            style={{
              width: `${total ? (row.count / total) * 100 : 0}%`,
              backgroundColor: sourceColor(row.engine),
            }}
          />
        ))}
      </div>
    </div>
  );
}

function EngineCoverageList({ rows, latestClaims, previousClaims }: { rows: EngineCoverageRow[]; latestClaims: ClaimDoc[]; previousClaims: ClaimDoc[] | null }) {
  const total = rows.reduce(
    (sum, row) => (row.status === "ok" ? sum + latestClaims.filter((claim) => claim.sourceEngine === row.engine).length : sum),
    0,
  );
  return (
    <div className="space-y-2.5">
      {rows.map((row) => {
        const count = latestClaims.filter((claim) => claim.sourceEngine === row.engine).length;
        const delta = previousClaims && row.status === "ok" ? count - previousClaims.filter((claim) => claim.sourceEngine === row.engine).length : null;
        return (
          <div key={row.engine} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-xs">
            <span className="flex items-center gap-2 truncate">
              <PlatformLogo engine={row.engine} className="size-3.5" />
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  row.status === "ok" ? "bg-ok" : row.status === "unavailable" ? "bg-warn" : "bg-muted-foreground/30",
                )}
              />
              {row.label}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{row.status === "ok" ? Intl.NumberFormat("en-US").format(count) : checkedStateLabel(row.status)}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {row.status === "ok" && total ? `${Math.round((count / total) * 100)}%` : "—"}
            </span>
            <DeltaTag delta={delta} />
          </div>
        );
      })}
    </div>
  );
}

export function OverviewTab({
  latestClaims,
  previousClaims,
  coverage,
  tags,
  hookItems,
  funnelItems,
  totalFindings,
  fallbackLabel,
  filters,
  setFilter,
  resetFilters,
  now,
  youtubeSnapshot,
  newsSnapshot,
  googleSnapshot,
  latestRunAt,
}: {
  latestClaims: ClaimDoc[];
  previousClaims: ClaimDoc[] | null;
  coverage: EngineCoverageRow[];
  tags: ClaimDoc[];
  hookItems: DistributionItem[];
  funnelItems: DistributionItem[];
  totalFindings?: number | null;
  fallbackLabel?: React.ReactNode;
  filters: BrandFilters;
  setFilter: <K extends keyof BrandFilters>(key: K, value: BrandFilters[K]) => void;
  resetFilters: () => void;
  now: number;
  youtubeSnapshot?: SnapshotDoc;
  newsSnapshot?: SnapshotDoc;
  googleSnapshot?: SnapshotDoc;
  latestRunAt?: string | null;
}) {
  const handleSelectHook = (hookType: string) => setFilter("hook", filters.hook === hookType ? "all" : hookType);
  const handleSelectFunnel = (stage: FunnelStage) => setFilter("funnel", filters.funnel === stage ? "all" : stage);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryPanel
          title={
            <MetricInfo
              label="Evidence mix"
              definition="Each source's share of this latest check's findings, plus the change from the previous check. It is a share of findings, not of the brand's posts, and a source that returned nothing is left out rather than shown as zero."
            />
          }
        >
          <EvidenceMix claims={latestClaims} previousClaims={previousClaims} />
        </SummaryPanel>
        <SummaryPanel
          title={
            <MetricInfo
              label="What we checked"
              definition="The sources this check queried and what each returned. “Not checked yet” and “nothing found” are different facts: the first means we did not look, the second that we looked and found nothing. Percentages are each source's share of this check's findings."
            />
          }
        >
          <EngineCoverageList rows={coverage} latestClaims={latestClaims} previousClaims={previousClaims} />
        </SummaryPanel>
        <SummaryPanel
          title={
            <MetricInfo
              label="Top hooks"
              definition="How often each hook type was tagged across this check's findings. It counts tagged findings, not posts, views, or spend, so a bigger check lifts every count. Shares are of tagged findings only."
            />
          }
          subtitle={fallbackLabel}
        >
          <HookChart items={hookItems} totalFindings={totalFindings} selectedHook={filters.hook} onSelectHook={handleSelectHook} />
        </SummaryPanel>
        {/* Renamed from "Funnel stage": funnelStage is a tag distribution across five
            categories, not a measured conversion sequence, so the panel name and its
            chart (EvidencePanels.tsx's FunnelPanel, left-aligned bars, never a
            tapering funnel silhouette) both avoid implying attrition we never measured. */}
        <SummaryPanel
          title={
            <MetricInfo
              label="Stage mix"
              definition="Each tagged finding's audience stage. These are tags, not a conversion path, so the shares sum to 100% and nobody drops out between rows."
            />
          }
          subtitle={fallbackLabel}
        >
          <FunnelPanel items={funnelItems} totalFindings={totalFindings} selectedStage={filters.funnel} onSelectStage={handleSelectFunnel} />
        </SummaryPanel>
      </div>
      {/* SimilarBrandsPanel moved to the brand header as a chip (BrandProfile.tsx),
          next to the evidence-signal and tagged-findings badges — a whole row for
          one chip was too much page for the data it held. */}
      <EvidenceSection
        latestClaims={latestClaims}
        tags={tags}
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        now={now}
        youtubeSnapshot={youtubeSnapshot}
        newsSnapshot={newsSnapshot}
        googleSnapshot={googleSnapshot}
        heading={(count) => (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="type-headline text-fg">{Intl.NumberFormat("en-US").format(count)} evidence cards</h2>
              {/* Reconciles the header's broader "N findings" badge (BrandProfile.tsx,
                  counts every real signal, including pure-count metrics like view/like
                  counts that never render as their own card) against this narrower count (only
                  findings with something to actually read — see brand-model.ts's isContentClaim).
                  Two real, differently-scoped numbers, both labelled, instead of one page stating
                  two different figures as if they measured the same thing. */}
              <p className="mt-0.5 text-[11px] text-muted-foreground">Browsable findings below — the header&apos;s findings count also includes measured values (views, likes, rank) shown in the panels above, not as standalone cards.</p>
            </div>
            <span className="text-xs text-muted-foreground">Findings as of {shortDate(latestRunAt)}</span>
          </div>
        )}
        tabLabel="Overview"
      />
    </div>
  );
}
