"use client";

import { useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart3, Filter, Layers, Search as SearchIcon, Tag } from "lucide-react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { HOOK_TYPES, FUNNEL_STAGES, LABEL_CLASS, iconProps, sourceColor } from "../tokens";
import { hookName, stageName } from "@/components/drishti/labels";
import { EmptyState } from "../EmptyState";
import {
  findGoogleNewsRawItem,
  funnelDistribution,
  hookDistribution,
  isContentClaim,
  mostRecentTaggedRunForEngines,
  previousRunFor,
  runHasRealTagForEngines,
  tagsForEngineSubset,
  type ClaimDoc,
  type RunDoc,
  type SnapshotDoc,
} from "./brand-model";
import { EvidenceCard } from "./EvidenceCard";
import { FilterSelect, FunnelPanel, HookChart, SummaryPanel } from "./EvidencePanels";
import { MetricInfo } from "../MetricInfo";
import { NewsEvidenceCard } from "./NewsEvidenceCard";
import { runTickLabel, shortDate } from "./format";

const SEARCH_ENGINES = ["google", "youtube", "google_news"] as const;

const TAB_ENGINES = ["google", "youtube", "google_news"] as const;
type SearchTabEngine = (typeof TAB_ENGINES)[number];
const RESULT_METRIC: Partial<Record<SearchTabEngine, string>> = {
  google: "google_organic_result_count",
  youtube: "youtube_search_result_count",
};
const ENGINE_TAB_LABEL: Record<SearchTabEngine, string> = {
  google: "Google Search",
  youtube: "YouTube Search",
  google_news: "Google News",
};
const ENGINE_FILTER_OPTIONS = TAB_ENGINES.filter((engine) => engine !== "youtube");

type TrendRow = { date: string; google: number | null; youtube: number | null; google_news: number | null };

function tagsForClaim(tags: ClaimDoc[], claim: ClaimDoc): ClaimDoc[] {
  return tags.filter(
    (tag) =>
      String(tag._id) === String(claim._id) ||
      (tag.taggedClaimId !== undefined && String(tag.taggedClaimId) === String(claim._id)),
  );
}

function trendRows(claims: ClaimDoc[], runsDesc: RunDoc[]): TrendRow[] {
  return [...runsDesc]
    .reverse()
    .map((run) => {
      const runId = String(run._id);
      const google = claims.find((claim) => String(claim.runId) === runId && claim.metric === RESULT_METRIC.google);
      const youtube = claims.find((claim) => String(claim.runId) === runId && claim.metric === RESULT_METRIC.youtube);
      const newsClaims = claims.filter((claim) => String(claim.runId) === runId && claim.sourceEngine === "google_news");
      const newsCount = newsClaims.filter((claim) => claim.metric === "google_news_result").length;
      return {
        date: runTickLabel(run.requestedAt),
        google: typeof google?.value === "number" ? google.value : null,
        youtube: typeof youtube?.value === "number" ? youtube.value : null,
        google_news: newsClaims.length > 0 ? newsCount : null,
      };
    })
    .filter((row) => row.google !== null || row.youtube !== null || row.google_news !== null);
}

export function SearchExperience({
  claims,
  runsDesc,
  latestRunId,
  newsSnapshot,
}: {
  claims: ClaimDoc[];
  runsDesc: RunDoc[];
  latestRunId: string | null;
  newsSnapshot?: SnapshotDoc;
}) {
  const reduceMotion = useReducedMotion();
  const [engineFilter, setEngineFilter] = useState("all");
  const [hookFilter, setHookFilter] = useState("all");
  const [funnelFilter, setFunnelFilter] = useState("all");

  const searchClaims = useMemo(
    () =>
      claims.filter(
        (claim): claim is ClaimDoc & { sourceEngine: SearchTabEngine } =>
          claim.sourceEngine === "google" || claim.sourceEngine === "youtube" || claim.sourceEngine === "google_news",
      ),
    [claims],
  );
  const latestSubset = useMemo(
    () => (latestRunId ? searchClaims.filter((claim) => String(claim.runId) === latestRunId) : []),
    [searchClaims, latestRunId],
  );

  const hasLatestSearchTags = latestRunId ? runHasRealTagForEngines(claims, latestRunId, SEARCH_ENGINES) : false;
  const searchFallbackRun = !hasLatestSearchTags ? mostRecentTaggedRunForEngines(claims, runsDesc, SEARCH_ENGINES) : null;
  const hookFunnelRunId = searchFallbackRun ? String(searchFallbackRun._id) : latestRunId;
  const hookFunnelPreviousRunId = hookFunnelRunId ? previousRunFor(claims, hookFunnelRunId) : null;
  const latestTags = hookFunnelRunId ? tagsForEngineSubset(claims, hookFunnelRunId, SEARCH_ENGINES) : [];
  const previousTags = useMemo(() => {
    if (hookFunnelPreviousRunId === null) return null;
    const rows = tagsForEngineSubset(claims, hookFunnelPreviousRunId, SEARCH_ENGINES);
    return rows.length > 0 ? rows : null;
  }, [claims, hookFunnelPreviousRunId]);
  const hookItems = hookDistribution(latestTags, previousTags);
  const funnelItems = funnelDistribution(latestTags, previousTags);
  const hookFunnelTotalFindings = hookFunnelRunId
    ? searchClaims.filter((claim) => String(claim.runId) === hookFunnelRunId).length
    : null;
  const searchFallbackLabel = searchFallbackRun ? (
    <p className="mt-1 font-mono text-[10px] text-muted-foreground">from the run on {shortDate(searchFallbackRun.requestedAt)}</p>
  ) : undefined;

  const rows = useMemo(() => trendRows(searchClaims, runsDesc), [searchClaims, runsDesc]);
  const chartConfig = {
    google: { label: "Google Search", color: sourceColor("google") },
    youtube: { label: "YouTube Search", color: sourceColor("youtube") },
    google_news: { label: "Google News", color: sourceColor("google_news") },
  } satisfies ChartConfig;

  const cardFilterTags = latestRunId ? tagsForEngineSubset(claims, latestRunId, TAB_ENGINES) : [];

  const filtered = latestSubset.filter(isContentClaim).filter((claim) => {
    if (engineFilter !== "all" && claim.sourceEngine !== engineFilter) return false;
    if (hookFilter === "all" && funnelFilter === "all") return true;
    const claimTags = tagsForClaim(cardFilterTags, claim);
    return (
      (hookFilter === "all" || claimTags.some((tag) => tag.hookType === hookFilter)) &&
      (funnelFilter === "all" || claimTags.some((tag) => tag.funnelStage === funnelFilter))
    );
  });
  const googleRows = filtered.filter((claim) => claim.sourceEngine === "google");
  const newsRows = filtered.filter((claim) => claim.sourceEngine === "google_news");
  const newsRawResponse = newsSnapshot?.rawResponse;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <SearchIcon className="size-4 text-accent" />
          <h2 className="text-base font-semibold">
            <MetricInfo
              label="Search result volume over time"
              definition="One bar per stored check for each source. Google and YouTube plot the result total the provider reported; Google News counts the articles we stored, so the three bars are not the same measure. A gap means the source did not run, never zero."
            />
          </h2>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            bounded
            icon={<SearchIcon {...iconProps} size={16} />}
            title="No search-volume history yet."
            description="No Google Search, YouTube Search, or Google News evidence is stored for this brand yet. Run a check to start the series."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-bg-raised px-3 pb-4 pt-5 sm:px-5">
            <p className={cn(LABEL_CLASS, "mb-3 text-muted-foreground")}>{rows.length === 1 ? "Single stored run — one bar per engine" : "Across stored runs"}</p>
            <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
              <BarChart accessibilityLayer data={rows} margin={{ left: -12, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} width={56} allowDecimals={false} />
                <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08, radius: 4 }} content={<ChartTooltipContent />} />
                <Bar dataKey="google" name="Google Search" fill="var(--color-google)" radius={[3, 3, 0, 0]} maxBarSize={rows.length > 1 ? 18 : 40} isAnimationActive={!reduceMotion} />
                <Bar dataKey="youtube" name="YouTube Search" fill="var(--color-youtube)" radius={[3, 3, 0, 0]} maxBarSize={rows.length > 1 ? 18 : 40} isAnimationActive={!reduceMotion} />
                <Bar dataKey="google_news" name="Google News" fill="var(--color-google_news)" radius={[3, 3, 0, 0]} maxBarSize={rows.length > 1 ? 18 : 40} isAnimationActive={!reduceMotion} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryPanel
          title={
            <MetricInfo
              label="Top hooks (search)"
              definition="How often each hook type was tagged across findings from Google, YouTube Search, and Google News. It counts tagged findings, not posts or spend, and shares are of tagged findings only."
            />
          }
          subtitle={searchFallbackLabel}
        >
          <HookChart items={hookItems} taggedCount={latestTags.length} totalFindings={hookFunnelTotalFindings} />
        </SummaryPanel>
        <SummaryPanel
          title={
            <MetricInfo
              label="Funnel stage (search)"
              definition="Each tagged finding's audience stage across this tab's sources. Stages are tags, not a conversion path, so the shares sum to 100% and nobody drops out between rows."
            />
          }
          subtitle={searchFallbackLabel}
        >
          <FunnelPanel items={funnelItems} taggedCount={latestTags.length} totalFindings={hookFunnelTotalFindings} />
        </SummaryPanel>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect icon={BarChart3} label="All engines" value={engineFilter} onChange={setEngineFilter} options={ENGINE_FILTER_OPTIONS.map((engine) => ({ value: engine, label: ENGINE_TAB_LABEL[engine] }))} />
        <FilterSelect icon={Tag} label="All hooks" value={hookFilter} onChange={setHookFilter} options={HOOK_TYPES.map((hook) => ({ value: hook, label: hookName(hook) }))} />
        <FilterSelect icon={Filter} label="All funnel stages" value={funnelFilter} onChange={setFunnelFilter} options={FUNNEL_STAGES.map((stage) => ({ value: stage, label: stageName(stage) }))} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Google</h3>
        {googleRows.length ? <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">{googleRows.map((claim) => <EvidenceCard key={String(claim._id)} claim={claim} />)}</div> : (
          <EmptyState
            size="sm"
            bounded
            icon={<SearchIcon {...iconProps} size={16} />}
            title="No Google Search evidence matches these filters."
            description="Clear a filter above, or run a check that captures organic Google results for this brand."
          />
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Google News</h3>
        {newsRows.length ? (
          <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {newsRows.map((claim) => (
              <NewsEvidenceCard key={String(claim._id)} claim={claim} raw={findGoogleNewsRawItem(newsRawResponse, claim.evidenceUrl)} />
            ))}
          </div>
        ) : (
          <EmptyState
            size="sm"
            bounded
            icon={<Layers {...iconProps} size={16} />}
            title="No Google News evidence matches these filters."
            description="Clear a filter above, or run a check that captures Google News coverage for this brand."
          />
        )}
      </div>
    </div>
  );
}
