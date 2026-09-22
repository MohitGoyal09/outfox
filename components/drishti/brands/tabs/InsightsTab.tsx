"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../../EmptyState";
import { iconProps } from "../../tokens";
import type { ClaimDoc } from "../brand-model";

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

export function InsightsTab({
  brandId,
  claims,
  now,
}: {
  brandId: Id<"brands">;
  claims: ClaimDoc[];
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Positioning insights</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            A grounded narrative of what makes this brand distinct, refreshed automatically as new evidence comes in.
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
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : feed.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Sparkles {...iconProps} size={16} />}
          title="The first insight is being generated."
          description="Opening this tab kicked off a positioning narrative for this brand. It will appear here once grounded claims are available to write from."
        />
      ) : (
        <ul className="space-y-3">
          {feed.map((entry) => (
            <li key={String(entry._id)}>
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
                  <Sparkles className="size-4 text-accent" />
                  <CardTitle className="text-sm">{relativeTime(entry.generatedAt, now)}</CardTitle>
                  {entry.mode === "template" ? (
                    <Badge
                      variant="outline"
                      className="ml-auto h-5 rounded-full border-amber-200 bg-amber-50 px-2 text-[10px] font-normal text-amber-700"
                    >
                      Template fallback
                    </Badge>
                  ) : null}
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2.5">
                    {entry.sentences.map((sentence, index) => (
                      <li key={index} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <p className="text-[13px] leading-5 text-foreground">{sentence.text}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          {sentence.citedClaimIds.map((claimId) => {
                            const claim = claimsById.get(String(claimId));
                            if (!claim) return null;
                            return (
                              <a
                                key={String(claimId)}
                                href={claim.evidenceUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                              >
                                Source <ArrowUpRight className="size-3" />
                              </a>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
