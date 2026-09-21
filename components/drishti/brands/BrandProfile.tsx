"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BarChart3, Bookmark, CheckCircle2, Clock3, ExternalLink, Filter, Globe2, History, Link2, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../EmptyState";
import { useAllRuns } from "../cohorts/useAllRuns";
import { formatStamp } from "../cohorts/cohorts-model";
import { HOOK_TYPES, FUNNEL_STAGES } from "../tokens";
import {
  engineCoverage,
  engineLabel,
  FETCH_ENGINES,
  findYoutubeRawVideo,
  funnelDistribution,
  groupYoutubeVideoClaims,
  hookDistribution,
  isContentClaim,
  mostRecentTaggedRun,
  previousRunFor,
  readYoutubeRawVideo,
  runHasRealTag,
  runHistoryRows,
  signalClaims,
  tagBearingClaims,
  trendPoints,
  type ClaimDoc,
  type EngineCoverageRow,
  type RunHistoryRow,
} from "./brand-model";
import { BrandMark } from "./BrandMark";
import { PlatformLogo } from "./PlatformLogo";
import { EvidenceCard, sourceAccent } from "./EvidenceCard";
import { FilterSelect, FunnelPanel, HookChart, SummaryPanel } from "./EvidencePanels";
import { shortDate } from "./format";
import { DestinationsPanel } from "./DestinationsPanel";
import { TrendsExperience } from "./TrendsExperience";
import { SearchExperience } from "./SearchExperience";
import { YouTubeExperience } from "./YouTubeExperience";
import { YouTubeVideoCard } from "./YouTubeVideoCard";

export type BrandProfileProps = { brandId: Id<"brands">; className?: string };

const tabs = [["overview", "Overview"], ["search", "Search"], ["youtube", "YouTube"], ["trends", "Trends"], ["destinations", "Destinations"], ["history", "History"]] as const;
const EVIDENCE_PAGE_SIZE = 24;
const TABLE_PAGE_SIZE = 40;

function tagsForClaim(tags: ClaimDoc[], claim: ClaimDoc): ClaimDoc[] {
  return tags.filter(
    (tag) =>
      String(tag._id) === String(claim._id) ||
      (tag.taggedClaimId !== undefined && String(tag.taggedClaimId) === String(claim._id)),
  );
}

function statusBadge(status: string) { const good = status === "ok" || status === "complete" || status === "ready"; return <Badge variant="outline" className={cn("h-6 rounded-full px-2.5 text-[11px] font-medium", good && "border-emerald-200 bg-emerald-50 text-emerald-700")}>{good ? <CheckCircle2 className="mr-1 size-3" /> : <Clock3 className="mr-1 size-3" />}{status}</Badge>; }

function ClaimsTable({ claims, empty = "No stored evidence for this context yet." }: { claims: ClaimDoc[]; empty?: string }) {
  const [limit, setLimit] = useState(TABLE_PAGE_SIZE);
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  if (claims.length === 0) return <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">{empty}</div>;
  const sorted = [...claims].sort((a, b) => order === "newest" ? (a.fetchedAt < b.fetchedAt ? 1 : -1) : (a.fetchedAt > b.fetchedAt ? 1 : -1));
  const visible = sorted.slice(0, limit);
  return <div className="space-y-2">
    <div className="flex items-center justify-end"><Button variant="outline" size="sm" className="h-7 rounded-md px-2 text-[11px]" onClick={() => setOrder((current) => current === "newest" ? "oldest" : "newest")}>{order === "newest" ? "Newest first" : "Oldest first"}</Button></div>
    <div className="overflow-hidden rounded-xl border border-border"><Table><TableHeader><TableRow><TableHead>Signal</TableHead><TableHead>Finding</TableHead><TableHead>Captured</TableHead><TableHead className="text-right">Source</TableHead></TableRow></TableHeader><TableBody>{visible.map((claim) => <TableRow key={String(claim._id)}><TableCell className="max-w-[190px] truncate font-medium">{claim.metric ?? "Signal"}</TableCell><TableCell className="max-w-[420px] whitespace-normal text-muted-foreground">{claim.text}</TableCell><TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">{shortDate(claim.fetchedAt)}</TableCell><TableCell className="text-right"><a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-accent hover:underline"><ExternalLink className="size-3" />{engineLabel(claim.sourceEngine)}</a></TableCell></TableRow>)}</TableBody></Table></div>
    {sorted.length > limit ? <div className="flex justify-center"><Button variant="outline" size="sm" onClick={() => setLimit((current) => current + TABLE_PAGE_SIZE)}>Show more</Button></div> : null}
  </div>;
}

function Coverage({ rows }: { rows: EngineCoverageRow[] }) { return <div className="flex flex-wrap items-center gap-2 text-xs"><span className="mr-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Coverage</span>{rows.map((row) => <span key={row.engine} title={row.reason ?? row.status} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground"><PlatformLogo engine={row.engine} className="size-3.5" /><span className={cn("size-1.5 rounded-full", row.status === "ok" ? "bg-emerald-500" : row.status === "unavailable" ? "bg-amber-500" : row.status === "failed" ? "bg-red-500" : "bg-muted-foreground/30")} />{row.label}</span>)}</div>; }

function EvidenceMix({ claims }: { claims: ClaimDoc[] }) { const rows = useMemo(() => FETCH_ENGINES.map((engine) => ({ engine, label: engineLabel(engine).replace("Google ", ""), count: claims.filter((claim) => claim.sourceEngine === engine).length })).filter((row) => row.count > 0), [claims]); const total = rows.reduce((sum, row) => sum + row.count, 0); return <div className="space-y-3">{rows.length ? rows.map((row) => <div key={row.engine} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs"><span className="flex items-center gap-2 truncate"><PlatformLogo engine={row.engine} className="size-3.5" />{row.label}</span><span className="font-mono text-muted-foreground">{row.count}</span><span className="font-mono text-[11px] text-emerald-600">{total ? `${Math.round(row.count / total * 100)}%` : "—"}</span></div>) : <p className="text-sm text-muted-foreground">No evidence mix for this run yet.</p>}<div className="flex h-2 overflow-hidden rounded-full bg-muted">{rows.map((row) => <span key={row.engine} style={{ width: `${total ? row.count / total * 100 : 0}%`, backgroundColor: sourceAccent[row.engine] ?? "#0f766e" }} />)}</div></div>; }

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
  return <Button variant="outline" size="sm" className="h-8 gap-1.5" title="Copy link to this page" onClick={() => void copyLink()}><Link2 className="size-3.5" />{copied ? "Copied" : "Copy link"}</Button>;
}

export function BrandProfile({ brandId, className }: BrandProfileProps) {
  const [tab, setTab] = useState("overview");
  const [engineFilter, setEngineFilter] = useState("all");
  const [hookFilter, setHookFilter] = useState("all");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [overviewLimit, setOverviewLimit] = useState(EVIDENCE_PAGE_SIZE);
  const brand = useQuery(api.brands.getBrand, { brandId });
  const claims = useQuery(api.claims.byBrand, { brandId });
  const { runs, isLoading: runsLoading } = useAllRuns();
  const latestRun = useMemo(() => { const related = runs.filter((run) => run.brandIds.some((id) => String(id) === String(brandId))); const finished = related.filter((run) => run.status === "complete" || run.status === "partial"); return (finished.length ? finished : related).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0] ?? null; }, [brandId, runs]);
  const snapshots = useQuery(api.snapshots.byRun, latestRun ? { runId: latestRun._id } : "skip");
  const latestClaims = useMemo(() => claims && latestRun ? claims.filter((claim) => String(claim.runId) === String(latestRun._id)) : [], [claims, latestRun]);
  const signals = signalClaims(latestClaims);
  const coverage = useMemo(() => engineCoverage(snapshots ?? [], String(brandId)).filter((row) => row.engine !== "google_ads_transparency_center"), [snapshots, brandId]);
  const tags = tagBearingClaims(latestClaims);
  const history = useMemo(() => runs.filter((run) => run.brandIds.some((id) => String(id) === String(brandId))).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)), [runs, brandId]);

  const hasLatestTags = runHasRealTag(latestClaims, latestRun ? String(latestRun._id) : "");
  const fallbackRun = !hasLatestTags ? mostRecentTaggedRun(claims ?? [], history) : null;
  const hookFunnelRunId = fallbackRun ? String(fallbackRun._id) : (latestRun ? String(latestRun._id) : null);
  const hookFunnelClaims = fallbackRun ? (claims ?? []).filter((claim) => String(claim.runId) === hookFunnelRunId) : latestClaims;
  const hookFunnelPreviousRunId = hookFunnelRunId ? previousRunFor(claims ?? [], hookFunnelRunId) : null;
  const hookFunnelPreviousClaims = hookFunnelPreviousRunId ? (claims ?? []).filter((claim) => String(claim.runId) === hookFunnelPreviousRunId) : null;
  const hookItems = hookDistribution(hookFunnelClaims, hookFunnelPreviousClaims);
  const funnelItems = funnelDistribution(hookFunnelClaims, hookFunnelPreviousClaims);
  const fallbackLabel = fallbackRun ? <p className="mt-1 font-mono text-[10px] text-muted-foreground">from the run on {formatStamp(fallbackRun.requestedAt)}</p> : undefined;

  const historyRows = useMemo(() => {
    const rows = runHistoryRows(runs, claims ?? []);
    const seen = new Set(rows.map((row) => row.runId));
    const missing: RunHistoryRow[] = history.filter((run) => !seen.has(String(run._id))).map((run) => ({ runId: String(run._id), requestedAt: run.requestedAt, completedAt: run.completedAt ?? null, status: run.status, claimCount: 0, engines: [], topHook: null, topFunnel: null, requestCount: run.requestCount ?? null, llmTokenCount: run.llmTokenCount ?? null, llmCostUsd: run.llmCostUsd ?? null, run }));
    return [...rows, ...missing].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  }, [runs, claims, history]);
  const filteredSignals = signals.filter(isContentClaim).filter((claim) => {
    if (engineFilter !== "all" && claim.sourceEngine !== engineFilter) return false;
    if (hookFilter === "all" && funnelFilter === "all") return true;
    const claimTags = tagsForClaim(tags, claim);
    return (
      (hookFilter === "all" || claimTags.some((tag) => tag.hookType === hookFilter)) &&
      (funnelFilter === "all" || claimTags.some((tag) => tag.funnelStage === funnelFilter))
    );
  });
  const isLoading = brand === undefined || claims === undefined || runsLoading || (latestRun !== null && snapshots === undefined);
  if (brand === null) return <EmptyState bounded title="This brand no longer exists." description="The profile address is valid, but the tracked brand was not found. Return to Brands and choose another profile." action={<Button asChild variant="outline"><Link href="/brands">Back to brands</Link></Button>} />;
  if (brand === undefined) return <div className="flex flex-col gap-6"><Skeleton className="h-36 rounded-2xl" /><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
  const trends = trendPoints(claims ?? []);
  const latestTrendSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google_trends" && String(snapshot.brandId) === String(brandId));
  const latestYoutubeVideoSnapshot = snapshots?.find((snapshot) => snapshot.engine === "youtube_video" && String(snapshot.brandId) === String(brandId));
  const latestGoogleNewsSnapshot = snapshots?.find((snapshot) => snapshot.engine === "google_news" && String(snapshot.brandId) === String(brandId));
  const overviewVideoGroups = groupYoutubeVideoClaims(filteredSignals);
  const overviewNonVideoSignals = filteredSignals.filter((claim) => claim.sourceEngine !== "youtube_video");
  const overviewCardCount = overviewVideoGroups.length + overviewNonVideoSignals.length;
  return <div className={cn("flex min-w-0 flex-col gap-0", className)}>
    <div className="mb-3 flex items-center justify-between"><Link href="/brands" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />All brands</Link><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Brand intelligence</span></div>
    <header className="border-b border-border pb-5"><div className="flex flex-wrap items-start justify-between gap-5"><div className="flex min-w-0 items-center gap-3"><BrandMark name={brand.name} domain={brand.domain} className="size-14" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{brand.name}</h1>{statusBadge(brand.profileStatus)}</div><p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>{brand.vertical}</span><span>•</span><span className="inline-flex items-center gap-1"><Globe2 className="size-3.5" />{brand.domain}</span><span>•</span><span>Last updated {shortDate(latestRun?.requestedAt ?? brand.lastRefreshedAt)}</span></p></div></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-8 gap-1.5"><Bookmark className="size-3.5" />Track</Button><ShareButton />{latestRun ? <Button asChild size="sm" className="h-8 gap-1.5"><Link href={`/runs/${latestRun._id}`}>Latest run <ArrowUpRight className="size-3.5" /></Link></Button> : null}</div></div><div className="mt-4 flex flex-wrap items-center gap-2"><Badge variant="outline" className="h-7 rounded-full border-accent/25 bg-accent/[0.06] px-2.5 text-accent"><BarChart3 className="mr-1.5 size-3.5" />{signals.length} evidence signals</Badge><Badge variant="outline" className="h-7 rounded-full px-2.5 text-muted-foreground"><Tag className="mr-1.5 size-3.5" />{tags.length} tagged findings</Badge><Coverage rows={coverage} /></div></header>
    <Tabs value={tab} onValueChange={setTab} className="gap-0"><div className="overflow-x-auto border-b border-border"><TabsList variant="line" className="h-12 min-w-max gap-1 rounded-none border-0 p-0">{tabs.map(([value, label]) => <TabsTrigger key={value} value={value} className="h-12 rounded-none px-3 text-xs data-[state=active]:font-semibold data-[state=active]:text-accent after:bg-accent">{label}</TabsTrigger>)}</TabsList></div>
      {tab === "overview" ? <div className="border-b border-border py-3"><div className="flex flex-wrap items-center gap-2"><FilterSelect icon={BarChart3} label="All engines" value={engineFilter} onChange={setEngineFilter} options={FETCH_ENGINES.map((engine) => ({ value: engine, label: engineLabel(engine) }))} /><FilterSelect icon={Tag} label="All hooks" value={hookFilter} onChange={setHookFilter} options={HOOK_TYPES.map((hook) => ({ value: hook, label: hook.replaceAll("_", " ") }))} /><FilterSelect icon={Filter} label="All funnel stages" value={funnelFilter} onChange={setFunnelFilter} options={FUNNEL_STAGES.map((stage) => ({ value: stage, label: stage.replaceAll("_", " ") }))} /></div></div> : null}
      {isLoading ? <div className="space-y-4 py-5"><Skeleton className="h-10 w-full rounded-lg" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div><Skeleton className="h-64 rounded-2xl" /></div> : <>
      <TabsContent value="overview" className="mt-0 space-y-5 py-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><SummaryPanel title="Evidence mix"><EvidenceMix claims={signals} /></SummaryPanel><SummaryPanel title="Engine coverage"><div className="space-y-2.5">{coverage.map((row) => <div key={row.engine} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs"><span className="flex items-center gap-2 truncate"><PlatformLogo engine={row.engine} className="size-3.5" /><span className={cn("size-1.5 rounded-full", row.status === "ok" ? "bg-emerald-500" : row.status === "unavailable" ? "bg-amber-500" : "bg-muted-foreground/30")} />{row.label}</span><span className="font-mono text-muted-foreground">{row.status === "ok" ? latestClaims.filter((claim) => claim.sourceEngine === row.engine).length : row.status}</span></div>)}</div></SummaryPanel><SummaryPanel title="Top hooks" subtitle={fallbackLabel}><HookChart items={hookItems} /></SummaryPanel><SummaryPanel title="Funnel stage" subtitle={fallbackLabel}><FunnelPanel items={funnelItems} /></SummaryPanel></div><div><div className="mb-3 flex items-end justify-between gap-3"><h2 className="text-base font-semibold tracking-[-0.02em]">{filteredSignals.length.toLocaleString()} pieces of evidence</h2><span className="text-xs text-muted-foreground">Stored claims from {shortDate(latestRun?.requestedAt)}</span></div>{filteredSignals.length ? <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{overviewVideoGroups.slice(0, overviewLimit).map((group) => <YouTubeVideoCard key={group.evidenceUrl} group={group} raw={readYoutubeRawVideo(findYoutubeRawVideo(latestYoutubeVideoSnapshot?.rawResponse, group.videoId))} />)}{overviewNonVideoSignals.slice(0, Math.max(0, overviewLimit - overviewVideoGroups.length)).map((claim) => <EvidenceCard key={String(claim._id)} claim={claim} />)}</div>{overviewCardCount > overviewLimit ? <div className="mt-4 flex justify-center"><Button variant="outline" size="sm" onClick={() => setOverviewLimit((limit) => limit + EVIDENCE_PAGE_SIZE)}>Load more</Button></div> : null}</> : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{signals.length === 0 ? "No signal claims have been stored for the latest run." : "No stored evidence matches these filters."}</div>}</div></TabsContent>
      <TabsContent value="search" className="mt-0 py-5"><SearchExperience claims={claims ?? []} runsDesc={history} latestRunId={latestRun ? String(latestRun._id) : null} newsSnapshot={latestGoogleNewsSnapshot} /></TabsContent>
      <TabsContent value="youtube" className="mt-0 py-5"><YouTubeExperience claims={claims ?? []} runsDesc={history} latestRunId={latestRun ? String(latestRun._id) : null} snapshot={latestYoutubeVideoSnapshot} /></TabsContent>
      <TabsContent value="trends" className="mt-0 space-y-4 py-5"><TrendsExperience snapshot={latestTrendSnapshot} claims={claims ?? []} brandId={brandId} brandName={brand.name} latestRunAt={latestRun?.requestedAt} /><Card className="shadow-none"><CardHeader><CardTitle className="text-sm">Stored trend evidence</CardTitle></CardHeader><CardContent><ClaimsTable claims={trends.map((point) => (claims ?? []).find((claim) => String(claim._id) === point.id)).filter((claim): claim is ClaimDoc => Boolean(claim))} empty="No relative interest values are stored yet." /></CardContent></Card></TabsContent>
      <TabsContent value="destinations" className="mt-0 py-5"><DestinationsPanel claims={latestClaims} /></TabsContent>
      <TabsContent value="history" className="mt-5"><Card className="shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="size-4 text-accent" />Run history</CardTitle></CardHeader><CardContent>{historyRows.length ? <div className="space-y-2">{historyRows.map((row) => <div key={row.runId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><div className="min-w-0 space-y-1.5"><div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{formatStamp(row.requestedAt)}</span>{statusBadge(row.status)}</div><div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>{row.claimCount} claims</span><span>{row.topHook ? `Top hook: ${row.topHook.replaceAll("_", " ")}` : "No hook tags"}</span><span>{row.topFunnel ? `Top funnel: ${row.topFunnel.replaceAll("_", " ")}` : "No funnel tags"}</span>{row.llmTokenCount !== null || row.llmCostUsd !== null ? <span className="font-mono">{row.llmTokenCount !== null ? `${row.llmTokenCount.toLocaleString()} tokens` : ""}{row.llmTokenCount !== null && row.llmCostUsd !== null ? " · " : ""}{row.llmCostUsd !== null ? `$${row.llmCostUsd.toFixed(2)}` : ""}</span> : null}</div></div><Link href={`/runs/${row.runId}`} className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-accent hover:underline">{row.runId.slice(-8)} <ArrowUpRight className="size-3" /></Link></div>)}</div> : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No runs stored for this brand yet.</div>}</CardContent></Card></TabsContent>
      </>}
    </Tabs>
  </div>;
}
