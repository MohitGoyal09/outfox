"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { ArrowUpRight, ChevronDown, RefreshCw, Sparkles, Target, TrendingUp, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { computeCreativeMix, diffMix } from "@/convex/pipeline/rollup";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmptyState } from "../../EmptyState";
import { Panel } from "../../Panel";
import { Skeleton, SkeletonRegion } from "../../Skeleton";
import { HOOK_COLOR, iconProps, type HookType } from "../../tokens";
import { hookName } from "@/components/drishti/labels";
import type { ClaimDoc } from "../brand-model";
import { displayClaimText } from "../format";
import { DeltaMark } from "../../DeltaMark";
import { stripEmDashes } from "@/lib/noEmDash";
import { RelativeTime } from "@/components/drishti/RelativeTime";


function modelText(text: string): string {
  return stripEmDashes(displayClaimText(text));
}

type BrandInsightSection = "positioning" | "audience" | "problem";

const SECTION_MARKER: Record<BrandInsightSection, string> = {
  positioning: "[[positioning]] ",
  audience: "[[audience]] ",
  problem: "[[problem]] ",
};

type InsightSentence = { text: string; citedClaimIds: Id<"claims">[] };

type FeedEntry = {
  _id: Id<"brandInsights">;
  generatedAt: string;
  mode: "llm" | "template" | "failed";
  sentences: InsightSentence[];
  failureReason?: string;
};

export type EarlierVerdictRow =
  | { id: string; generatedAt: string; kind: "llm"; text: string }
  | { id: string; generatedAt: string; kind: "failed"; reason: string | null };

export function earlierVerdictRows(entries: FeedEntry[]): EarlierVerdictRow[] {
  const rows: EarlierVerdictRow[] = [];
  for (const entry of entries) {
    if (entry.mode === "failed") {
      const reason = entry.failureReason?.trim();
      rows.push({ id: String(entry._id), generatedAt: entry.generatedAt, kind: "failed", reason: reason && reason.length > 0 ? reason : null });
      continue;
    }
    if (entry.mode === "llm") {
      const lead = bucketSentences(entry.sentences).positioning[0];
      if (lead && lead.text.trim().length > 0) {
        rows.push({ id: String(entry._id), generatedAt: entry.generatedAt, kind: "llm", text: modelText(lead.text) });
      }
      continue;
    }
  }
  return rows;
}

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
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">{title}</h3>
      </div>
      <div className="p-4">
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
                <p className="text-[13px] leading-5 text-fg">{modelText(sentence.text)}</p>
                <CitationLinks citedClaimIds={sentence.citedClaimIds} claimsById={claimsById} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
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
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <TrendingUp className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">What changed</h3>
      </div>
      <div className="p-4">
        {!hasPreviousRun ? (
          <EmptyState
            size="sm"
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No earlier check to compare."
            description="Only one check exists for this brand yet. Change needs a second check."
          />
        ) : movers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No measurable change in hook mix since the previous check.</p>
        ) : (
          <ul className="space-y-2">
            <li aria-hidden className="grid grid-cols-[1fr_auto_auto] gap-2 text-[12px] font-medium text-fg-tertiary">
              <span>Hook</span>
              <span>Previous check → this check</span>
              <span>Change</span>
            </li>
            {movers.map((row) => (
              <li key={row.hook} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[12px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.hook as HookType] }} />
                  <span className="truncate">{hookName(row.hook)}</span>
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {row.before} → {row.after}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  <DeltaMark direction={row.delta > 0 ? "up" : "down"} />
                  {Math.abs(row.delta)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

export function InsightsTab({
  brandId,
  claims,
}: {
  brandId: Id<"brands">;
  claims: ClaimDoc[];
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
  const [latest, ...earlier] = feed ?? [];
  const buckets = useMemo(() => (latest ? bucketSentences(latest.sentences) : null), [latest]);
  const templateMode = latest?.mode === "template";
  const earlierVerdicts = earlierVerdictRows(earlier);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="type-headline text-fg">Brand DNA</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            How this brand positions itself, who it talks to, what it sells against, and what changed since the previous check. Every claim cites its source.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => void refreshNow()} disabled={generating}>
          <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
          {generating ? "Refreshing…" : "Refresh now"}
        </Button>
      </div>

      {feed === undefined ? (
        <SkeletonRegion label="Loading Brand DNA">
          <Skeleton variant="block" height={160} />
        </SkeletonRegion>
      ) : latest?.mode === "failed" ? (
        <EmptyState
          size="sm"
          icon={<Sparkles {...iconProps} size={16} />}
          title="The last Brand DNA read failed."
          description={latest.failureReason?.trim() || "No reason was recorded. Refresh to try again."}
        />
      ) : latest === undefined || buckets === null ? (
        <EmptyState
          size="sm"
          icon={<Sparkles {...iconProps} size={16} />}
          title="The first read is being generated."
          description="Opening this tab kicked off a Brand DNA read for this brand. It will appear here once grounded claims are available to write from."
        />
      ) : (
        <>
          <Panel interactive={false} className="overflow-hidden border-accent/25 bg-accent/[0.03]">
            <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
              <Sparkles className="size-4 text-fg" aria-hidden />
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">Positioning: <RelativeTime iso={latest.generatedAt} /></h3>
              {templateMode ? (
                <Badge variant="outline" className="ml-auto h-5 rounded-full border-warn/30 bg-warn/10 px-2 text-[10px] font-normal text-warn">
                  Template fallback
                </Badge>
              ) : null}
            </div>
            <div className="space-y-4 p-4">
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
                    <p className="text-lg font-semibold leading-6 tracking-[-0.01em] text-fg">{modelText(buckets.positioning[0].text)}</p>
                    <CitationLinks citedClaimIds={buckets.positioning[0].citedClaimIds} claimsById={claimsById} />
                  </div>
                  {buckets.positioning.length > 1 ? (
                    <ol className="space-y-2.5 border-t border-border pt-4">
                      {buckets.positioning.slice(1).map((sentence, index) => (
                        <li key={index} className="flex gap-2.5">
                          <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">{index + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[13px] leading-5 text-fg">{modelText(sentence.text)}</p>
                            <CitationLinks citedClaimIds={sentence.citedClaimIds} claimsById={claimsById} />
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </>
              )}
            </div>
          </Panel>

          <div className="grid gap-3 md:grid-cols-2">
            <DnaSectionCard
              icon={Users}
              title="Who it's talking to"
              sentences={buckets.audience}
              claimsById={claimsById}
              emptyDescription="No finding carries a real audience hint yet, this fills in once an enriched, tagged check captures who the content targets."
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

      {earlierVerdicts.length > 0 ? (
        <Collapsible>
          <CollapsibleTrigger className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-fg-secondary hover:text-fg">
            Earlier reads ({earlierVerdicts.length})
            <ChevronDown aria-hidden className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 space-y-1.5">
              {earlierVerdicts.map((row) => (
                <li key={row.id} className="flex items-baseline gap-2.5 rounded-lg border border-border/60 px-3 py-2 text-[12px]">
                  {row.kind === "failed" ? (
                    <span className="min-w-0 truncate text-danger">Check failed{row.reason ? `: ${row.reason}` : ""}</span>
                  ) : (
                    <span className="min-w-0 truncate text-foreground">{row.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
