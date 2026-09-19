"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type MatrixClaim = {
  brandId: string;
  hookType?: string;
  funnelStage?: string;
};

const HOOK_TYPES = [
  "discount_offer",
  "social_proof",
  "founder_story",
  "problem_solution",
  "product_feature",
  "urgency_scarcity",
  "education_explainer",
  "visual_cold_open",
  "not_applicable",
];

const FUNNEL_STAGES = [
  "unaware",
  "problem_aware",
  "solution_aware",
  "product_aware",
  "most_aware",
  "not_applicable",
];

function distribution(
  claims: MatrixClaim[],
  brands: { id: string }[],
  pick: (c: MatrixClaim) => string,
  buckets: string[],
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const bucket of buckets) {
    out[bucket] = {};
    for (const b of brands) out[bucket]![b.id] = 0;
  }
  for (const claim of claims) {
    const key = pick(claim) || "not_applicable";
    const bucket = buckets.includes(key) ? key : "not_applicable";
    if (out[bucket] && out[bucket]![claim.brandId] !== undefined) {
      out[bucket]![claim.brandId]! += 1;
    }
  }
  return out;
}

export function ComparisonMatrix({
  claims,
  brands,
  loading = false,
  error = null,
  className,
}: {
  claims: MatrixClaim[] | undefined;
  brands: { id: string; name: string }[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}) {
  if (loading || claims === undefined) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        <Spinner className="size-4" /> Loading comparison.
      </div>
    );
  }
  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive",
          className,
        )}
      >
        Comparison failed to load: {error}
      </div>
    );
  }
  if (brands.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No brands in this cohort yet. Add brands on the home page to compare
        them.
      </div>
    );
  }
  if (claims.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No stored claims for these brands yet. Run a live refresh to collect
        evidence, or load the cached run.
      </div>
    );
  }
  const hookDist = distribution(
    claims,
    brands,
    (c) => c.hookType ?? "not_applicable",
    HOOK_TYPES,
  );
  const funnelDist = distribution(
    claims,
    brands,
    (c) => c.funnelStage ?? "not_applicable",
    FUNNEL_STAGES,
  );

  const table = (
    title: string,
    rows: string[],
    dist: Record<string, Record<string, number>>,
  ) => (
    <div>
      <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      <div className="mt-2 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-3 py-2 font-medium text-muted-foreground">
                Type
              </th>
              {brands.map((b) => (
                <th
                  key={b.id}
                  className="px-3 py-2 font-medium text-muted-foreground"
                >
                  {b.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-border">
                <td className="px-3 py-2 text-foreground">{row}</td>
                {brands.map((b) => (
                  <td key={b.id} className="px-3 py-2 text-foreground">
                    {dist[row]?.[b.id] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <section
      aria-label="Comparison matrix"
      className={cn(
        "space-y-6 rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-card-foreground">
        Comparison matrix
      </h2>
      {table("Hook type distribution", HOOK_TYPES, hookDist)}
      {table("Funnel stage distribution", FUNNEL_STAGES, funnelDist)}
    </section>
  );
}
