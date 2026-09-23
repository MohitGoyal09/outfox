"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { engineLabel, FETCH_ENGINES, type ClaimDoc, type EngineCoverageRow, type SnapshotDoc } from "../brand-model";
import { DeltaTag, FunnelPanel, HookChart, SummaryPanel } from "../EvidencePanels";
import { PlatformLogo } from "../PlatformLogo";
import { sourceAccent } from "../EvidenceCard";
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
        return { engine, label: engineLabel(engine).replace("Google ", ""), count, delta };
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
            <span className="font-mono text-[11px] text-emerald-600">{total ? `${Math.round((row.count / total) * 100)}%` : "—"}</span>
            <DeltaTag delta={row.delta} />
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No evidence mix for this run yet.</p>
      )}
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {rows.map((row) => (
          <span key={row.engine} style={{ width: `${total ? (row.count / total) * 100 : 0}%`, backgroundColor: sourceAccent[row.engine] ?? "#0f766e" }} />
        ))}
      </div>
    </div>
  );
}

function EngineCoverageList({ rows, latestClaims, previousClaims }: { rows: EngineCoverageRow[]; latestClaims: ClaimDoc[]; previousClaims: ClaimDoc[] | null }) {
  return (
    <div className="space-y-2.5">
      {rows.map((row) => {
        const count = latestClaims.filter((claim) => claim.sourceEngine === row.engine).length;
        const delta = previousClaims && row.status === "ok" ? count - previousClaims.filter((claim) => claim.sourceEngine === row.engine).length : null;
        return (
          <div key={row.engine} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
            <span className="flex items-center gap-2 truncate">
              <PlatformLogo engine={row.engine} className="size-3.5" />
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  row.status === "ok" ? "bg-emerald-500" : row.status === "unavailable" ? "bg-amber-500" : "bg-muted-foreground/30",
                )}
              />
              {row.label}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{row.status === "ok" ? Intl.NumberFormat("en-US").format(count) : row.status}</span>
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
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryPanel title="Evidence mix">
          <EvidenceMix claims={latestClaims} previousClaims={previousClaims} />
        </SummaryPanel>
        <SummaryPanel title="Engine coverage">
          <EngineCoverageList rows={coverage} latestClaims={latestClaims} previousClaims={previousClaims} />
        </SummaryPanel>
        <SummaryPanel title="Top hooks" subtitle={fallbackLabel}>
          <HookChart items={hookItems} />
        </SummaryPanel>
        {/* Renamed from "Funnel stage": funnelStage is a tag distribution across five
            categories, not a measured conversion sequence, so the panel name and its
            chart (EvidencePanels.tsx's FunnelPanel, left-aligned bars, never a
            tapering funnel silhouette) both avoid implying attrition we never measured. */}
        <SummaryPanel title="Stage mix" subtitle={fallbackLabel}>
          <FunnelPanel items={funnelItems} />
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
              <h2 className="text-base font-semibold tracking-[-0.02em]">{Intl.NumberFormat("en-US").format(count)} evidence cards</h2>
              {/* Reconciles the header's broader "N evidence signals" badge (BrandProfile.tsx,
                  counts every stored signal claim, including pure-count metrics like view/like
                  counts that never render as their own card) against this narrower count (only
                  claims with something to actually read — see brand-model.ts's isContentClaim).
                  Two real, differently-scoped numbers, both labelled, instead of one page stating
                  two different figures as if they measured the same thing. */}
              <p className="mt-0.5 text-[11px] text-muted-foreground">Browsable claims below — the header&apos;s evidence-signal count also includes measured counts (views, likes, rank) shown in the panels above, not as standalone cards.</p>
            </div>
            <span className="text-xs text-muted-foreground">Stored claims from {shortDate(latestRunAt)}</span>
          </div>
        )}
        tabLabel="Overview"
      />
    </div>
  );
}
