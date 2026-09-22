"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { ArrowUpRight, BarChart3, Layers, RefreshCw, Sparkles, Tag } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../../EmptyState";
import { iconProps } from "../../tokens";
import { countClaimsByEngine, hookTypeFrequency, signalClaims, type ClaimDoc } from "../brand-model";
import { RankedCatalogChart } from "../RankedCatalogChart";

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

function CitationLinks({
  citedClaimIds,
  claimsById,
}: {
  citedClaimIds: string[];
  claimsById: Map<string, ClaimDoc>;
}) {
  const links = citedClaimIds
    .map((id) => claimsById.get(String(id)))
    .filter((claim): claim is ClaimDoc => claim !== undefined);
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
    { label: "Evidence signals", value: signalCount, icon: BarChart3 },
    { label: "Tagged findings", value: tags.length, icon: Tag },
    { label: "Engines represented", value: engineCount, icon: Layers },
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

  const claimsById = useMemo(
    () => new Map(claims.map((claim) => [String(claim._id), claim])),
    [claims],
  );
  const hookRows = useMemo(() => hookTypeFrequency(tags), [tags]);
  const [latest, ...earlier] = feed ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Brand verdict</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            The single clearest read on this brand&apos;s positioning, with the evidence that backs it — refreshed automatically as new evidence comes in.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => void refreshNow()}
          disabled={generating}
        >
          <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
          {generating ? "Refreshing…" : "Refresh now"}
        </Button>
      </div>

      {feed === undefined ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : latest === undefined ? (
        <EmptyState
          size="sm"
          icon={<Sparkles {...iconProps} size={16} />}
          title="The first verdict is being generated."
          description="Opening this tab kicked off a positioning read for this brand. It will appear here once grounded claims are available to write from."
        />
      ) : (
        <Card className="shadow-none border-accent/25 bg-accent/[0.03]">
          <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
            <Sparkles className="size-4 text-accent" />
            <CardTitle className="text-sm">{relativeTime(latest.generatedAt, now)}</CardTitle>
            {latest.mode === "template" ? (
              <Badge
                variant="outline"
                className="ml-auto h-5 rounded-full border-amber-200 bg-amber-50 px-2 text-[10px] font-normal text-amber-700"
              >
                Template fallback
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {latest.sentences[0] ? (
              <div>
                <p className="text-lg font-semibold leading-6 tracking-[-0.01em] text-foreground">
                  {latest.sentences[0].text}
                </p>
                <CitationLinks citedClaimIds={latest.sentences[0].citedClaimIds} claimsById={claimsById} />
              </div>
            ) : null}
            {latest.sentences.length > 1 ? (
              <ol className="space-y-2.5 border-t border-border/70 pt-4">
                {latest.sentences.slice(1).map((sentence, index) => (
                  <li key={index} className="flex gap-2.5">
                    <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-5 text-foreground">{sentence.text}</p>
                      <CitationLinks citedClaimIds={sentence.citedClaimIds} claimsById={claimsById} />
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          The receipts
        </h3>
        <div className="space-y-3">
          <InsightsStatRow latestClaims={latestClaims} tags={tags} />
          <RankedCatalogChart
            title="Top hooks"
            rows={hookRows}
            emptyTitle="No tagged hooks yet."
            emptyDescription="Ranks the real hookType an enrichment run assigned to stored claims, most frequent first — fills in after a tagged run."
          />
        </div>
      </div>

      {earlier.length > 0 ? (
        <div>
          <h3 className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Earlier verdicts
          </h3>
          <ul className="space-y-1.5">
            {earlier.map((entry) => (
              <li
                key={String(entry._id)}
                className="flex items-baseline gap-2.5 rounded-lg border border-border/60 px-3 py-2 text-[12px]"
              >
                <span className="shrink-0 text-muted-foreground">{relativeTime(entry.generatedAt, now)}</span>
                <span className="min-w-0 truncate text-foreground">{entry.sentences[0]?.text ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
