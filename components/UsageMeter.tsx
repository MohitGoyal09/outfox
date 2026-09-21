"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "not reported";
  const decimals = Math.abs(value) > 0 && Math.abs(value) < 1 ? 4 : 2;
  return `$${value.toFixed(decimals)}`;
}

export function UsageMeter({
  requestCount,
  creditCount,
  creditsReported,
  searchesLeftBefore,
  searchesLeftAfter,
  llmRequestCount,
  llmTokenCount,
  exactCostUsd,
  estimatedCostUsd,
  loading = false,
  error = null,
  className,
}: {
  requestCount?: number;
  creditCount?: number;
  creditsReported?: boolean;
  searchesLeftBefore?: number;
  searchesLeftAfter?: number;
  llmRequestCount?: number;
  llmTokenCount?: number;
  exactCostUsd?: number;
  estimatedCostUsd?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        <Spinner className="size-4" /> Loading usage.
      </div>
    );
  }
  if (error) {
    return (
      <div className={cn("rounded-lg border border-destructive/30 bg-card p-5 text-sm text-destructive", className)}>
        Usage failed to load: {error}
      </div>
    );
  }
  if (requestCount === undefined) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        No run yet, so no usage to show. Load a cached run or refresh to see
        SerpApi counts.
      </div>
    );
  }

  const creditValue =
    creditsReported === false
      ? "Not reported by the provider"
      : creditsReported === true
        ? creditCount !== undefined
          ? `${creditCount} used`
          : "Not reported by the provider"
        : creditCount !== undefined
          ? `${creditCount}`
          : "Not reported by the provider";

  const cost =
      exactCostUsd !== undefined && estimatedCostUsd !== undefined
      ? {
          amount: formatUsd(exactCostUsd + estimatedCostUsd),
          badge: "exact + est.",
          note: "Part billed by the provider, part estimated from list prices.",
        }
      : exactCostUsd !== undefined
      ? {
          amount: formatUsd(exactCostUsd),
          badge: "exact",
          note: "As billed by the provider.",
        }
      : estimatedCostUsd !== undefined
        ? {
            amount: formatUsd(estimatedCostUsd),
            badge: "estimated",
            note: "Estimated from token rates, not a bill.",
          }
        : null;

  return (
    <Card aria-label="Usage" className={cn("border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4"><CardTitle className="text-sm font-semibold tracking-[-0.01em]">Run usage</CardTitle></CardHeader>
      <CardContent><dl className="flex flex-wrap gap-8 p-5 text-sm">
        <div>
          <dt className="text-[var(--text-tertiary)]">SerpApi requests</dt>
          <dd className="text-xl font-semibold text-[var(--text-primary)]">
            {requestCount}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-tertiary)]">Credits this run</dt>
          <dd className="text-xl font-semibold text-[var(--text-primary)]">
            {creditValue}
          </dd>
          {creditsReported === false ? (
            <p className="mt-1 max-w-56 text-xs font-normal text-muted-foreground">
              The provider did not report credits for this run.
            </p>
          ) : null}
        </div>
        {searchesLeftAfter !== undefined ? (
          <div>
            <dt className="text-muted-foreground">Searches left</dt>
            <dd className="text-xl font-semibold text-foreground">
              {searchesLeftBefore !== undefined
                ? `${searchesLeftBefore} to ${searchesLeftAfter}`
                : searchesLeftAfter}
            </dd>
          </div>
        ) : null}
        {llmRequestCount !== undefined || llmTokenCount !== undefined ? (
          <div>
            <dt className="text-muted-foreground">Model calls</dt>
            <dd className="text-xl font-semibold text-foreground">
              {llmRequestCount ?? "Not reported"}
              {llmTokenCount !== undefined ? (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ({llmTokenCount} tokens)
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
        {cost !== null ? (
          <div>
            <dt className="text-muted-foreground">
              Model cost
              <span
                className={cn(
                  "ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  cost.badge === "exact"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {cost.badge}
              </span>
            </dt>
            <dd className="text-xl font-semibold text-foreground">
              {cost.amount}
            </dd>
            <p className="mt-1 max-w-56 text-xs font-normal text-muted-foreground">
              {cost.note}
            </p>
          </div>
        ) : null}
      </dl></CardContent>
    </Card>
  );
}
