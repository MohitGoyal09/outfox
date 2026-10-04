"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { offTopicIds } from "../topicality";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { checkedStateLabel } from "@/components/drishti/labels";
import { isContentClaim, tagsForClaim, type ClaimDoc, type EngineCoverageRow, type SnapshotDoc } from "../brand-model";
import { sourceColor, type FunnelStage } from "../../tokens";
import { MetricInfo } from "../../MetricInfo";
import { DeltaTag, FunnelPanel, HookChart, SummaryPanel } from "../EvidencePanels";
import { PlatformLogo } from "../PlatformLogo";
import { SourceFreshness } from "../SourceFreshness";
import { EvidenceGrid, evidenceCardCount } from "../EvidenceGrid";
import { describeActiveBrandFilters, isDefaultBrandFilters, matchesBrandFilters, type BrandFilters } from "../filters/filters-model";
import type { DistributionItem } from "../../DistributionPanel";

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
              {row.status === "ok" && total ? `${Math.round((count / total) * 100)}%` : "-"}
            </span>
            <DeltaTag delta={delta} />
          </div>
        );
      })}
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {rows.map((row) => {
          const count = latestClaims.filter((claim) => claim.sourceEngine === row.engine).length;
          return row.status === "ok" && total ? (
            <span key={row.engine} style={{ width: `${(count / total) * 100}%`, backgroundColor: sourceColor(row.engine) }} />
          ) : null;
        })}
      </div>
    </div>
  );
}

const NEWEST_COUNT = 6;

function NewestFindings({
  latestClaims,
  tags,
  filters,
  now,
  evidenceHref,
  resetFilters,
  youtubeSnapshot,
  newsSnapshot,
  googleSnapshot,
}: {
  latestClaims: ClaimDoc[];
  tags: ClaimDoc[];
  filters: BrandFilters;
  now: number;
  evidenceHref: string;
  resetFilters: () => void;
  youtubeSnapshot?: SnapshotDoc;
  newsSnapshot?: SnapshotDoc;
  googleSnapshot?: SnapshotDoc;
}) {
  const brandId = latestClaims[0]?.brandId;
  const brand = useQuery(api.brands.getBrand, brandId ? { brandId } : "skip");
  const showOffTopic = filters.offtopic === "show";
  const matching = useMemo(() => {
    const content = latestClaims.filter((claim) => isContentClaim(claim));
    const off = showOffTopic || !brand ? new Set<string>() : offTopicIds(content, new Map([[String(brand._id), brand]]));
    return content.filter(
      (claim) => !off.has(String(claim._id)) && matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, now),
    );
  }, [latestClaims, tags, filters, now, showOffTopic, brand]);
  const activeFilters = isDefaultBrandFilters(filters) ? null : describeActiveBrandFilters(filters);
  return (
    <section aria-label="Newest evidence" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="type-headline text-fg">Newest evidence</h2>
        {activeFilters ? (
          <p className="text-xs text-muted-foreground">
            Filtered to {activeFilters}.{" "}
            <button type="button" onClick={resetFilters} className="text-accent hover:underline">
              Clear
            </button>
          </p>
        ) : null}
      </div>
      <EvidenceGrid
        claims={matching}
        youtubeSnapshot={youtubeSnapshot}
        newsSnapshot={newsSnapshot}
        googleSnapshot={googleSnapshot}
        sort="newest"
        maxCards={NEWEST_COUNT}
        columnsClass="columns-1 gap-4 sm:columns-2 lg:columns-3"
        emptyMessage="No findings to show for this check."
        pageLabel="Overview"
      />
      <Link href={evidenceHref} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium text-accent hover:bg-muted">
        See all {Intl.NumberFormat("en-US").format(evidenceCardCount(matching))} in Evidence
      </Link>
    </section>
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
  evidenceHref = "?tab=evidence",
  youtubeSnapshot,
  newsSnapshot,
  googleSnapshot,
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
  evidenceHref?: string;
  youtubeSnapshot?: SnapshotDoc;
  newsSnapshot?: SnapshotDoc;
  googleSnapshot?: SnapshotDoc;
}) {
  const handleSelectHook = (hookType: string) => setFilter("hook", filters.hook === hookType ? "all" : hookType);
  const handleSelectFunnel = (stage: FunnelStage) => setFilter("funnel", filters.funnel === stage ? "all" : stage);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SummaryPanel
          title={
            <MetricInfo
              label="Sources"
              definition="The sources this check queried, how many findings each returned, and each one's share of this check's findings. “Not checked yet” and “nothing found” are different facts: the first means we did not look, the second that we looked and found nothing. A share is of findings, not of the brand's posts."
            />
          }
        >
          <EngineCoverageList rows={coverage} latestClaims={latestClaims} previousClaims={previousClaims} />
          <SourceFreshness coverage={coverage} latestClaims={latestClaims} now={now} />
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
          <HookChart items={hookItems} taggedCount={tags.length} totalFindings={totalFindings} selectedHook={filters.hook} onSelectHook={handleSelectHook} />
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
          <FunnelPanel items={funnelItems} taggedCount={tags.length} totalFindings={totalFindings} selectedStage={filters.funnel} onSelectStage={handleSelectFunnel} />
        </SummaryPanel>
      </div>
      <NewestFindings latestClaims={latestClaims} tags={tags} filters={filters} now={now} evidenceHref={evidenceHref} resetFilters={resetFilters} youtubeSnapshot={youtubeSnapshot} newsSnapshot={newsSnapshot} googleSnapshot={googleSnapshot} />
    </div>
  );
}
