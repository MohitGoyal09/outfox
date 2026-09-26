"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BarChart3, CheckCircle2, Clock3, Compass, Globe2, LayoutGrid, Link2, Layers, MapPin, Tag, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { useAllRuns } from "../cohorts/useAllRuns";
import { formatStamp, profileStatusLabel } from "../cohorts/cohorts-model";
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
import { BrandMark } from "./BrandMark";
import { NarrativeBlock, type NarrativeBullet, type NarrativeCitation } from "./NarrativeBlock";
import { OwnBrandToggle } from "./OwnBrandToggle";
import { SimilarBrandsPanel } from "./SimilarBrandsPanel";
import { displayClaimText, shortDate } from "./format";
import { sourceName } from "@/components/drishti/labels";
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
  ["overview", "Overview", LayoutGrid],
  ["position", "Position", Compass],
  ["placement", "Placement", MapPin],
  ["people", "People", Users],
  ["evidence", "Evidence", Layers],
] as const;

type TabValue = (typeof tabs)[number][0];
const DEFAULT_TAB: TabValue = "overview";

function isTabValue(value: string | null): value is TabValue {
  return value !== null && tabs.some(([tabId]) => tabId === value);
}

type InsightSentence = { text: string; citedClaimIds: Id<"claims">[] };
type NarrativeSection = "positioning" | "audience" | "problem";
type BrandNarrative = { headline: string; headlineCitation: NarrativeCitation | null; bullets: NarrativeBullet[] };

const NARRATIVE_SECTION_MARKER: Record<NarrativeSection, string> = {
  positioning: "[[positioning]] ",
  audience: "[[audience]] ",
  problem: "[[problem]] ",
};

function bucketNarrativeSections(sentences: readonly InsightSentence[]): Record<NarrativeSection, InsightSentence[]> {
  const buckets: Record<NarrativeSection, InsightSentence[]> = { positioning: [], audience: [], problem: [] };
  for (const sentence of sentences) {
    const section = (Object.keys(NARRATIVE_SECTION_MARKER) as NarrativeSection[]).find((key) =>
      sentence.text.startsWith(NARRATIVE_SECTION_MARKER[key]),
    );
    if (section) {
      buckets[section].push({
        text: sentence.text.slice(NARRATIVE_SECTION_MARKER[section].length),
        citedClaimIds: sentence.citedClaimIds,
      });
    } else {
      buckets.positioning.push(sentence);
    }
  }
  return buckets;
}

function narrativeCitation(ids: readonly Id<"claims">[], claimsById: Map<string, ClaimDoc>): NarrativeCitation | null {
  for (const id of ids) {
    const claim = claimsById.get(String(id));
    if (claim) return { href: claim.evidenceUrl, label: sourceName(claim.sourceEngine) };
  }
  return null;
}

function narrativeFrom(sentences: readonly InsightSentence[], claimsById: Map<string, ClaimDoc>): BrandNarrative | null {
  const [lead, ...support] = sentences;
  if (!lead || lead.text.trim().length === 0) return null;
  return {
    headline: displayClaimText(lead.text),
    headlineCitation: narrativeCitation(lead.citedClaimIds, claimsById),
    bullets: support
      .filter((sentence) => sentence.text.trim().length > 0)
      .slice(0, 4)
      .map((sentence) => ({
        text: displayClaimText(sentence.text),
        citation: narrativeCitation(sentence.citedClaimIds, claimsById),
      })),
  };
}

function overallNarrative(buckets: Record<NarrativeSection, InsightSentence[]>, claimsById: Map<string, ClaimDoc>): BrandNarrative | null {
  const lead = buckets.positioning[0];
  if (!lead) return null;
  const support = [
    ...buckets.positioning.slice(1),
    ...buckets.audience.slice(0, 1),
    ...buckets.problem.slice(0, 1),
  ].slice(0, 4);
  return {
    headline: displayClaimText(lead.text),
    headlineCitation: narrativeCitation(lead.citedClaimIds, claimsById),
    bullets: support
      .filter((sentence) => sentence.text.trim().length > 0)
      .map((sentence) => ({
        text: displayClaimText(sentence.text),
        citation: narrativeCitation(sentence.citedClaimIds, claimsById),
      })),
  };
}

function statusBadge(status: string) {
  const good = status === "ok" || status === "complete" || status === "ready";
  return (
    <Badge variant="outline" className={cn("h-6 rounded-full px-2.5 text-[11px] font-medium", good ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/30 bg-warn/10 text-warn")}>
      {good ? <CheckCircle2 className="mr-1 size-3" /> : <Clock3 className="mr-1 size-3" />}
      {profileStatusLabel(status)}
    </Badge>
  );
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
    <Button variant="outline" size="sm" className="h-8 gap-1.5" title="Copy link to this page" onClick={() => void copyLink()}>
      <Link2 className="size-3.5" />
      {copied ? "Copied" : "Copy link"}
    </Button>
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
  const insight = useQuery(api.brandInsights.latestForBrand, { brandId });
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
    () => engineCoverage(snapshots ?? [], String(brandId)).filter((row) => row.engine !== "google_ads_transparency_center"),
    [snapshots, brandId],
  );
  const tags = tagBearingClaims(latestClaims);
  const claimsById = useMemo(
    () => new Map((claims ?? []).map((claim) => [String(claim._id), claim])),
    [claims],
  );
  const narratives = useMemo(() => {
    if (!insight || insight.mode !== "llm") return null;
    const buckets = bucketNarrativeSections(insight.sentences);
    return {
      overview: overallNarrative(buckets, claimsById),
      position: narrativeFrom(buckets.positioning, claimsById),
      people: narrativeFrom(buckets.audience, claimsById),
      evidence: narrativeFrom(buckets.problem, claimsById),
    };
  }, [insight, claimsById]);
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
  const fallbackLabel = fallbackRun ? <p className="mt-1 font-mono text-[10px] text-muted-foreground">from the check on {formatStamp(fallbackRun.requestedAt)}</p> : undefined;

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
          <Button asChild variant="outline">
            <Link href="/brands">Back to brands</Link>
          </Button>
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

  const latestTrendSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google_trends" && String(snapshot.brandId) === String(brandId));
  const latestYoutubeVideoSnapshot = snapshots?.find((snapshot) => snapshot.engine === "youtube_video" && String(snapshot.brandId) === String(brandId));
  const latestGoogleNewsSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google_news" && String(snapshot.brandId) === String(brandId));
  const latestGoogleSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google" && String(snapshot.brandId) === String(brandId));
  const latestYoutubeSearchSnapshot = snapshots?.find((snapshot) => snapshot.engine === "youtube" && String(snapshot.brandId) === String(brandId));

  return (
    <div className={cn("flex min-w-0 flex-col gap-0", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Link href="/brands" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          All brands
        </Link>
      </div>
      <header className="pb-5">
        <Panel interactive={false} className="p-5" ariaLabel="Brand identity">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark name={brand.name} domain={brand.domain} className="size-14" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="type-display truncate text-fg">{brand.name}</h1>
                  {statusBadge(brand.profileStatus)}
                  {brand.isOwnBrand === true ? (
                    <Badge variant="outline" className="h-6 rounded-full border-accent/35 bg-accent/[0.08] px-2.5 text-[11px] font-medium text-accent">
                      Your brand
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{brand.vertical}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Globe2 className="size-3.5" />
                    {brand.domain}
                  </span>
                  <span aria-hidden>·</span>
                  <span>Last updated {shortDate(latestRun?.requestedAt ?? brand.lastRefreshedAt)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <OwnBrandToggle brandId={brandId} isOwn={brand.isOwnBrand === true} size="sm" className="h-8" />
              <ShareButton />
              {latestRun ? (
                <Button asChild size="sm" className="h-8 gap-1.5">
                  <Link href={`/runs/${latestRun._id}`}>
                    Latest check <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-7 rounded-full border-accent/25 bg-accent/[0.06] px-2.5 text-accent">
              <BarChart3 className="mr-1.5 size-3.5" />
              {Intl.NumberFormat("en-US").format(signals.length)} findings
            </Badge>
            <Badge variant="outline" className="h-7 rounded-full px-2.5 text-muted-foreground">
              <Tag className="mr-1.5 size-3.5" />
              {/* `tags.length === 0` means no tag row exists for this run at
                  all -- tagging never touched it, the same "absent" the
                  engine coverage rows call `not_run` -- not that tagging ran
                  and found nothing (PRODUCT.md principle 2). A run that IS
                  tagged always has at least one tag-bearing claim, even one
                  the tagger marked `not_applicable`, so a real zero-finding
                  run can never land here. */}
              {tags.length > 0
                ? `${Intl.NumberFormat("en-US").format(tags.length)} tagged finding${tags.length === 1 ? "" : "s"}`
                : "Not tagged"}
            </Badge>
            <SimilarBrandsPanel brandId={brandId} />
          </div>
        </Panel>
      </header>
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="overflow-x-auto border-b border-border">
          <TabsList variant="line" className="h-12 min-w-max gap-1 rounded-none border-0 p-0">
            {tabs.map(([value, label, Icon]) => (
              <TabsTrigger key={value} value={value} className="h-12 gap-1.5 rounded-none px-3 text-xs data-[state=active]:font-semibold data-[state=active]:text-accent after:bg-accent">
                <Icon className="size-3.5" aria-hidden="true" />
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
              {narratives?.overview ? <NarrativeBlock className="mb-5" {...narratives.overview} /> : null}
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
                youtubeSnapshot={latestYoutubeVideoSnapshot}
                newsSnapshot={latestGoogleNewsSnapshot}
                googleSnapshot={latestGoogleSnapshot}
                latestRunAt={latestRun?.requestedAt}
              />
              {/* Brand DNA: the model's cited read of this brand, kept on the
                  landing tab so the answer and its evidence are never a tab
                  apart (it used to be its own "Insights" tab). */}
              <div className="mt-8 border-t border-border pt-6">
                <InsightsTab brandId={brandId} claims={claims ?? []} latestClaims={latestClaims} tags={tags} now={now} />
              </div>
            </TabsContent>
            <TabsContent value="position" className="mt-0 py-5">
              {narratives?.position ? <NarrativeBlock className="mb-5" {...narratives.position} /> : null}
              <PositionTab brand={brand} latestClaims={latestClaims} previousClaims={previousClaims} tags={tags} filters={filters} now={now} />
              {/* Problem is a positioning lens — the pain points the brand
                  frames itself against — so it lives under Position rather
                  than as its own tab. */}
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
            <TabsContent value="placement" className="mt-0 py-5">
              {/* Brand DNA has no distribution section, so Placement opens on
                  its evidence with no narrative rather than a fabricated one. */}
              <PlacementTab latestClaims={latestClaims} tags={tags} filters={filters} now={now} />
            </TabsContent>
            <TabsContent value="people" className="mt-0 py-5">
              {narratives?.people ? <NarrativeBlock className="mb-5" {...narratives.people} /> : null}
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
              {narratives?.evidence ? <NarrativeBlock className="mb-5" {...narratives.evidence} /> : null}
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
