"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PillButton, pillClasses } from "../PillButton";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { useAllRuns } from "../cohorts/useAllRuns";
import { categoryLabel } from "./add-brand-model";
import { statusLabel } from "./status-labels";
import { formatStamp } from "../cohorts/cohorts-model";
import {
  engineCoverage,
  funnelDistribution,
  hookDistribution,
  mostRecentTaggedRun,
  previousRunFor,
  runHasRealTag,
  runHistoryRows,
  signalClaims,
  tagBearingClaims,
  type ClaimDoc,
  type RunHistoryRow,
} from "./brand-model";
import { OwnBrandToggle } from "./OwnBrandToggle";
import { shortDate } from "./format";
import { useBrandFilters } from "./filters/useBrandFilters";
import { OverviewTab } from "./tabs/OverviewTab";
import { PositionTab } from "./tabs/PositionTab";
import { PlacementTab } from "./tabs/PlacementTab";
import { ProblemTab } from "./tabs/ProblemTab";
import { PeopleTab } from "./tabs/PeopleTab";
import { EvidenceTab } from "./tabs/EvidenceTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { InsightsTab } from "./tabs/InsightsTab";

export type BrandProfileProps = { brandId: Id<"brands">; className?: string };

const tabs = [
  ["overview", "Overview"],
  ["insights", "Insights"],
  ["position", "Position"],
  ["placement", "Placement"],
  ["people", "People"],
  ["evidence", "Evidence"],
] as const;

type TabValue = (typeof tabs)[number][0];
const DEFAULT_TAB: TabValue = "overview";

function isTabValue(value: string | null): value is TabValue {
  return value !== null && tabs.some(([tabId]) => tabId === value);
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  }
  return (
    <PillButton variant="outline" size="sm" title="Copy link to this page" onClick={() => void copyLink()}>
      {copied ? "Copied" : "Share"}
    </PillButton>
  );
}

export function BrandProfile({ brandId, className }: BrandProfileProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const tab: TabValue = isTabValue(tabParam) ? tabParam : DEFAULT_TAB;
  const setTab = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams);
      if (next === DEFAULT_TAB) params.delete("tab");
      else params.set("tab", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const brand = useQuery(api.brands.getBrand, { brandId });
  const claims = useQuery(api.claims.byBrand, { brandId });
  const { runs, isLoading: runsLoading } = useAllRuns();
  const { filters, setFilter, resetFilters } = useBrandFilters();
  const [now] = useState(() => Date.now());

  const latestRun = useMemo(() => {
    const related = runs.filter((run) => run.brandIds.some((id) => String(id) === String(brandId)));
    const finished = related.filter((run) => run.status === "complete" || run.status === "partial");
    return (finished.length ? finished : related).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0] ?? null;
  }, [brandId, runs]);
  const snapshots = useQuery(api.snapshots.byRun, latestRun ? { runId: latestRun._id } : "skip");
  const latestClaims = useMemo(
    () => (claims && latestRun ? claims.filter((claim) => String(claim.runId) === String(latestRun._id)) : []),
    [claims, latestRun],
  );
  const signals = signalClaims(latestClaims);
  const previousRunId = latestRun ? previousRunFor(claims ?? [], String(latestRun._id)) : null;
  const previousClaims = useMemo(
    () => (previousRunId ? (claims ?? []).filter((claim) => String(claim.runId) === previousRunId) : null),
    [claims, previousRunId],
  );
  const coverage = useMemo(
    () => engineCoverage(snapshots ?? [], String(brandId)),
    [snapshots, brandId],
  );
  const tags = tagBearingClaims(latestClaims);
  const history = useMemo(
    () => runs.filter((run) => run.brandIds.some((id) => String(id) === String(brandId))).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [runs, brandId],
  );

  const hasLatestTags = runHasRealTag(latestClaims, latestRun ? String(latestRun._id) : "");
  const fallbackRun = !hasLatestTags ? mostRecentTaggedRun(claims ?? [], history) : null;
  const hookFunnelRunId = fallbackRun ? String(fallbackRun._id) : latestRun ? String(latestRun._id) : null;
  const hookFunnelClaims = fallbackRun ? (claims ?? []).filter((claim) => String(claim.runId) === hookFunnelRunId) : latestClaims;
  const hookFunnelPreviousRunId = hookFunnelRunId ? previousRunFor(claims ?? [], hookFunnelRunId) : null;
  const hookFunnelPreviousClaims = hookFunnelPreviousRunId ? (claims ?? []).filter((claim) => String(claim.runId) === hookFunnelPreviousRunId) : null;
  const hookItems = hookDistribution(hookFunnelClaims, hookFunnelPreviousClaims);
  const funnelItems = funnelDistribution(hookFunnelClaims, hookFunnelPreviousClaims);
  const hookFunnelTotalFindings = signalClaims(hookFunnelClaims).length;
  const fallbackLabel = fallbackRun ? <p className="mt-1 font-mono text-xs text-muted-foreground">from the check on {formatStamp(fallbackRun.requestedAt)}</p> : undefined;

  const historyRows = useMemo(() => {
    const rows = runHistoryRows(runs, claims ?? []);
    const seen = new Set(rows.map((row) => row.runId));
    const missing: RunHistoryRow[] = history
      .filter((run) => !seen.has(String(run._id)))
      .map((run) => ({
        runId: String(run._id),
        requestedAt: run.requestedAt,
        completedAt: run.completedAt ?? null,
        status: run.status,
        claimCount: 0,
        engines: [],
        topHook: null,
        topFunnel: null,
        requestCount: run.requestCount ?? null,
        llmTokenCount: run.llmTokenCount ?? null,
        llmCostUsd: run.llmCostUsd ?? null,
        run,
      }));
    return [...rows, ...missing].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  }, [runs, claims, history]);

  const isLoading = brand === undefined || claims === undefined || runsLoading || (latestRun !== null && snapshots === undefined);
  if (brand === null) {
    return (
      <EmptyState
        bounded
        title="This brand no longer exists."
        description="The profile address is valid, but the tracked brand was not found. Return to Brands and choose another profile."
        action={
          <Link href="/brands" className={pillClasses("outline")}>
            Back to brands
          </Link>
        }
      />
    );
  }
  if (brand === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonRegion label="Loading this brand">
          <div className="flex flex-col gap-5">
            <Skeleton variant="block" height={120} />
            <Skeleton variant="row" height={44} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Skeleton variant="block" height={160} />
              <Skeleton variant="block" height={160} />
              <Skeleton variant="block" height={160} />
              <Skeleton variant="block" height={160} />
            </div>
          </div>
        </SkeletonRegion>
      </div>
    );
  }

  const evidenceParams = new URLSearchParams(searchParams);
  evidenceParams.set("tab", "evidence");
  const evidenceHref = `${pathname}?${evidenceParams.toString()}`;

  const latestTrendSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google_trends" && String(snapshot.brandId) === String(brandId));
  const latestYoutubeVideoSnapshot = snapshots?.find((snapshot) => snapshot.engine === "youtube_video" && String(snapshot.brandId) === String(brandId));
  const latestGoogleNewsSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google_news" && String(snapshot.brandId) === String(brandId));
  const latestGoogleSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google" && String(snapshot.brandId) === String(brandId));
  const latestYoutubeSearchSnapshot = snapshots?.find((snapshot) => snapshot.engine === "youtube" && String(snapshot.brandId) === String(brandId));

  return (
    <div className={cn("flex min-w-0 flex-col gap-0", className)}>
      <PageHeader
        variant="entity"
        eyebrow={
          <>
            <Link href="/brands" className="hover:text-fg">
              Brands
            </Link>{" "}
            / {brand.name}
          </>
        }
        title={brand.name}
        meta={[
          brand.domain,
          categoryLabel(brand.vertical),
          `Last check ${shortDate(latestRun?.requestedAt ?? brand.lastRefreshedAt)}`,
          ...(brand.profileStatus === "ready"
            ? []
            : [`Profile ${statusLabel(brand.profileStatus).toLowerCase()}`]),
        ].join(" · ")}
        actions={
          <>
            {latestRun ? (
              <Link href={`/runs/${latestRun._id}`} className={pillClasses("ink", "sm")}>
                Latest check
              </Link>
            ) : null}
            <ShareButton />
            <OwnBrandToggle brandId={brandId} isOwn={brand.isOwnBrand === true} size="sm" className={pillClasses("outline", "sm")} />
          </>
        }
      />
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="overflow-x-auto">
          <TabsList variant="ink" className="min-w-max">
            {tabs.map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {isLoading ? (
          <div className="space-y-4 py-5">
            <SkeletonRegion label="Loading this tab">
              <Skeleton variant="row" height={40} />
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Skeleton variant="block" height={160} />
                <Skeleton variant="block" height={160} />
                <Skeleton variant="block" height={160} />
                <Skeleton variant="block" height={160} />
              </div>
              <Skeleton className="mt-3" variant="block" height={256} />
            </SkeletonRegion>
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="mt-0 py-5">
              <OverviewTab
                latestClaims={latestClaims}
                previousClaims={previousClaims}
                coverage={coverage}
                tags={tags}
                hookItems={hookItems}
                funnelItems={funnelItems}
                totalFindings={hookFunnelTotalFindings}
                fallbackLabel={fallbackLabel}
                filters={filters}
                setFilter={setFilter}
                resetFilters={resetFilters}
                now={now}
                evidenceHref={evidenceHref}
                youtubeSnapshot={latestYoutubeVideoSnapshot}
                newsSnapshot={latestGoogleNewsSnapshot}
                googleSnapshot={latestGoogleSnapshot}
                findingsCount={signals.length}
                brandId={brandId}
              />
            </TabsContent>
            <TabsContent value="insights" className="mt-0 py-5">
              <InsightsTab brandId={brandId} claims={claims ?? []} />
              <div className="mt-8 border-t border-border pt-6">
                <ProblemTab
                  brand={brand}
                  latestClaims={latestClaims}
                  claims={claims ?? []}
                  tags={tags}
                  trendsSnapshot={latestTrendSnapshot}
                  latestRunAt={latestRun?.requestedAt}
                  filters={filters}
                  now={now}
                />
              </div>
            </TabsContent>
            <TabsContent value="position" className="mt-0 py-5">
              <PositionTab brand={brand} latestClaims={latestClaims} previousClaims={previousClaims} tags={tags} filters={filters} now={now} />
            </TabsContent>
            <TabsContent value="placement" className="mt-0 py-5">
              <PlacementTab latestClaims={latestClaims} tags={tags} filters={filters} now={now} />
            </TabsContent>
            <TabsContent value="people" className="mt-0 py-5">
              <PeopleTab
                brand={brand}
                latestClaims={latestClaims}
                tags={tags}
                filters={filters}
                now={now}
                youtubeSnapshot={latestYoutubeVideoSnapshot}
                youtubeSearchSnapshot={latestYoutubeSearchSnapshot}
              />
            </TabsContent>
            <TabsContent value="evidence" className="mt-0 py-5">
              <EvidenceTab
                latestClaims={latestClaims}
                tags={tags}
                filters={filters}
                setFilter={setFilter}
                resetFilters={resetFilters}
                now={now}
                youtubeSnapshot={latestYoutubeVideoSnapshot}
                newsSnapshot={latestGoogleNewsSnapshot}
                googleSnapshot={latestGoogleSnapshot}
              />
              <div className="mt-8 border-t border-border pt-6">
                <HistoryTab rows={historyRows} />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export type { ClaimDoc };
