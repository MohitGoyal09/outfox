"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { ArrowUpRight, BarChart3, Layers, RefreshCw, Sparkles, Tag, Target, TrendingUp, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { computeCreativeMix, diffMix } from "@/convex/pipeline/rollup";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../../EmptyState";
import { HOOK_COLOR, iconProps, type HookType } from "../../tokens";
import { hookName } from "@/components/drishti/labels";
import { countClaimsByEngine, hookTypeFrequency, signalClaims, type ClaimDoc } from "../brand-model";
import { displayClaimText } from "../format";
import { RankedCatalogChart } from "../RankedCatalogChart";


type BrandInsightSection = "positioning" | "audience" | "problem";

const SECTION_MARKER: Record<BrandInsightSection, string> = {
  positioning: "[[positioning]] ",
  audience: "[[audience]] ",
  problem: "[[problem]] ",
};

type InsightSentence = { text: string; citedClaimIds: Id<"claims">[] };

function bucketSentences(sentences: InsightSentence[]): Record<BrandInsightSection, InsightSentence[]> {
  const buckets: Record<BrandInsightSection, InsightSentence[]> = { positioning: [], audience: [], problem: [] };
  for (const sentence of sentences) {
    const section = (Object.keys(SECTION_MARKER) as BrandInsightSection[]).find((key) => sentence.text.startsWith(SECTION_MARKER[key]));
    if (section) {
      buckets[section].push({ ...sentence, text: sentence.text.slice(SECTION_MARKER[section].length) });
    } else {
      buckets.positioning.push(sentence);
    }
  }
  return buckets;
}

function relativeTime(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  if (!Number.isFinite(diffMs)) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function CitationLinks({ citedClaimIds, claimsById }: { citedClaimIds: Id<"claims">[]; claimsById: Map<string, ClaimDoc> }) {
  const links = citedClaimIds.map((id) => claimsById.get(String(id))).filter((claim): claim is ClaimDoc => claim !== undefined);
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-3">
      {links.map((claim) => (
        <a
          key={String(claim._id)}
          href={claim.evidenceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
        >
          Source <ArrowUpRight className="size-3" />
        </a>
      ))}
    </div>
  );
}

function InsightsStatRow({ latestClaims, tags }: { latestClaims: ClaimDoc[]; tags: ClaimDoc[] }) {
  const signalCount = useMemo(() => signalClaims(latestClaims).length, [latestClaims]);
  const engineCount = useMemo(() => countClaimsByEngine(latestClaims).length, [latestClaims]);
  const stats = [
    { label: "Findings", value: signalCount, icon: BarChart3 },
    { label: "Tagged findings", value: tags.length, icon: Tag },
    { label: "Sources represented", value: engineCount, icon: Layers },
  ];
  return (
    <Card className="shadow-none">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="text-sm">Evidence at a glance</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 pt-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon className="size-4 text-accent" />
            <div>
              <p className="font-mono text-lg font-semibold leading-none tabular-nums text-foreground">
                {Intl.NumberFormat("en-US").format(value)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DnaSectionCard({
  icon: Icon,
  title,
  sentences,
  claimsById,
  emptyDescription,
  templateMode,
}: {
  icon: typeof Users;
  title: string;
  sentences: InsightSentence[];
  claimsById: Map<string, ClaimDoc>;
  emptyDescription: string;
  templateMode: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <Icon className="size-4 text-accent" />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {sentences.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Icon {...iconProps} size={16} />}
            title="Not enough evidence yet."
            description={templateMode ? "The last read fell back to the template, which only covers positioning. A refresh with the model available will fill this in once there's real tagged evidence." : emptyDescription}
          />
        ) : (
          <ul className="space-y-2.5">
            {sentences.map((sentence, index) => (
              <li key={index}>
                <p className="text-[13px] leading-5 text-foreground">{displayClaimText(sentence.text)}</p>
                <CitationLinks citedClaimIds={sentence.citedClaimIds} claimsById={claimsById} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function groupClaimsByRunRecency(claims: ClaimDoc[]): ClaimDoc[][] {
  const byRun = new Map<string, ClaimDoc[]>();
  for (const claim of claims) {
    const runId = String(claim.runId);
    const bucket = byRun.get(runId);
    if (bucket) bucket.push(claim);
    else byRun.set(runId, [claim]);
  }
  return [...byRun.values()].sort((a, b) => {
    const latestA = a.reduce((max, c) => (c.fetchedAt > max ? c.fetchedAt : max), "");
    const latestB = b.reduce((max, c) => (c.fetchedAt > max ? c.fetchedAt : max), "");
    return latestA < latestB ? 1 : latestA > latestB ? -1 : 0;
  });
}

export type HookMoversResult = { hasPreviousRun: boolean; movers: ReturnType<typeof diffMix> };

export function hookMoversBetweenRecentRuns(claims: ClaimDoc[]): HookMoversResult {
  const runGroups = groupClaimsByRunRecency(claims);
  if (runGroups.length < 2) return { hasPreviousRun: false, movers: [] };
  const currMix = computeCreativeMix(runGroups[0]);
  const prevMix = computeCreativeMix(runGroups[1]);
  const movers = diffMix(prevMix, currMix)
    .filter((row) => row.hook !== "not_applicable" && row.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);
  return { hasPreviousRun: true, movers };
}

function WhatChangedCard({ claims }: { claims: ClaimDoc[] }) {
  const { hasPreviousRun, movers } = useMemo(() => hookMoversBetweenRecentRuns(claims), [claims]);

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <TrendingUp className="size-4 text-accent" />
        <CardTitle className="text-sm">What changed</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasPreviousRun ? (
          <EmptyState
            size="sm"
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No earlier check to compare."
            description="Only one check exists for this brand yet. Change needs a second check — never a guessed baseline."
          />
        ) : movers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No measurable change in hook mix since the earlier check.</p>
        ) : (
          <ul className="space-y-2">
            {movers.map((row) => (
              <li key={row.hook} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[12px]">
                <span className="flex min-w-0 items-center gap-2 capitalize">
                  <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.hook as HookType] }} />
                  <span className="truncate">{hookName(row.hook)}</span>
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {row.before} → {row.after}
                </span>
                <span className={cn("font-mono text-[11px] tabular-nums", row.delta > 0 ? "text-emerald-600" : "text-red-600")}>
                  {row.delta > 0 ? "+" : ""}
                  {row.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function InsightsTab({
  brandId,
  claims,
  latestClaims,
  tags,
  now,
}: {
  brandId: Id<"brands">;
  claims: ClaimDoc[];
  latestClaims: ClaimDoc[];
  tags: ClaimDoc[];
  now: number;
}) {
  const feed = useQuery(api.brandInsights.feedForBrand, { brandId });
  const generateInsight = useAction(api.pipeline.brandInsights.generateBrandInsight);
  const [generating, setGenerating] = useState(false);
  const autoFiredForBrand = useRef<string | null>(null);

  useEffect(() => {
    const key = String(brandId);
    if (autoFiredForBrand.current === key) return;
    autoFiredForBrand.current = key;
    setGenerating(true);
    void generateInsight({ brandId })
      .catch(() => {
      })
      .finally(() => setGenerating(false));
  }, [brandId, generateInsight]);

  async function refreshNow() {
    if (generating) return;
    setGenerating(true);
    try {
      await generateInsight({ brandId, force: true });
    } catch {
    } finally {
      setGenerating(false);
    }
  }

  const claimsById = useMemo(() => new Map(claims.map((claim) => [String(claim._id), claim])), [claims]);
  const hookRows = useMemo(() => hookTypeFrequency(tags), [tags]);
  const [latest, ...earlier] = feed ?? [];
  const buckets = useMemo(() => (latest ? bucketSentences(latest.sentences) : null), [latest]);
  const templateMode = latest?.mode === "template";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Brand DNA</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Four cited reads on this brand: how it positions itself, who it talks to, what it sells against, and what changed — refreshed automatically as new evidence comes in.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => void refreshNow()} disabled={generating}>
          <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
          {generating ? "Refreshing…" : "Refresh now"}
        </Button>
      </div>

      {feed === undefined ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : latest === undefined || buckets === null ? (
        <EmptyState
          size="sm"
          icon={<Sparkles {...iconProps} size={16} />}
          title="The first read is being generated."
          description="Opening this tab kicked off a Brand DNA read for this brand. It will appear here once grounded claims are available to write from."
        />
      ) : (
        <>
          <Card className="shadow-none border-accent/25 bg-accent/[0.03]">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
              <Sparkles className="size-4 text-accent" />
              <CardTitle className="text-sm">Positioning — {relativeTime(latest.generatedAt, now)}</CardTitle>
              {templateMode ? (
                <Badge variant="outline" className="ml-auto h-5 rounded-full border-amber-200 bg-amber-50 px-2 text-[10px] font-normal text-amber-700">
                  Template fallback
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {buckets.positioning.length === 0 ? (
                <EmptyState
                  size="sm"
                  icon={<Sparkles {...iconProps} size={16} />}
                  title="Not enough evidence yet."
                  description="This brand doesn't have enough tagged theme, value-proposition, or hook-type findings yet for a real positioning pattern."
                />
              ) : (
                <>
                  <div>
                    <p className="text-lg font-semibold leading-6 tracking-[-0.01em] text-foreground">{displayClaimText(buckets.positioning[0].text)}</p>
                    <CitationLinks citedClaimIds={buckets.positioning[0].citedClaimIds} claimsById={claimsById} />
                  </div>
                  {buckets.positioning.length > 1 ? (
                    <ol className="space-y-2.5 border-t border-border/70 pt-4">
                      {buckets.positioning.slice(1).map((sentence, index) => (
                        <li key={index} className="flex gap-2.5">
                          <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">{index + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[13px] leading-5 text-foreground">{displayClaimText(sentence.text)}</p>
                            <CitationLinks citedClaimIds={sentence.citedClaimIds} claimsById={claimsById} />
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            <DnaSectionCard
              icon={Users}
              title="Who it's talking to"
              sentences={buckets.audience}
              claimsById={claimsById}
              emptyDescription="No finding carries a real audience hint yet — this fills in once an enriched, tagged check captures who the content targets."
              templateMode={templateMode}
            />
            <DnaSectionCard
              icon={Target}
              title="What it's selling against"
              sentences={buckets.problem}
              claimsById={claimsById}
              emptyDescription="Not enough hook-type or theme evidence yet to name a real problem the brand's messaging frames against."
              templateMode={templateMode}
            />
          </div>

          <WhatChangedCard claims={claims} />
        </>
      )}

      <div>
        <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">The receipts</h3>
        <div className="space-y-3">
          <InsightsStatRow latestClaims={latestClaims} tags={tags} />
          <RankedCatalogChart
            title="Top hooks"
            rows={hookRows}
            formatLabel={hookName}
            emptyTitle="No tagged hooks yet."
            emptyDescription="Ranks the real hook type an enrichment check assigned to findings, most frequent first — fills in after a tagged check."
          />
        </div>
      </div>

      {earlier.length > 0 ? (
        <div>
          <h3 className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Earlier verdicts</h3>
          <ul className="space-y-1.5">
            {earlier.map((entry) => {
              const entryPositioning = bucketSentences(entry.sentences).positioning;
              return (
                <li key={String(entry._id)} className="flex items-baseline gap-2.5 rounded-lg border border-border/60 px-3 py-2 text-[12px]">
                  <span className="shrink-0 text-muted-foreground">{relativeTime(entry.generatedAt, now)}</span>
                  <span className="min-w-0 truncate text-foreground">{entryPositioning[0] ? displayClaimText(entryPositioning[0].text) : "—"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
