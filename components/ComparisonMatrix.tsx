"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, VALUE_CLASS } from "@/components/drishti";

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
          "flex items-center gap-2 border-t border-[var(--border)] py-5 text-sm text-[var(--text-secondary)]",
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
          "border-t border-[var(--danger)] py-5 text-sm text-[var(--danger)]",
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
          "border-t border-[var(--border)] py-5 text-sm text-[var(--text-secondary)]",
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
          "border-t border-[var(--border)] py-5 text-sm text-[var(--text-secondary)]",
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
      <h3 className="type-headline text-[var(--text-primary)]">{title}</h3>
      <div className="mt-2 overflow-x-auto border border-[var(--border)]">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className={cn("px-3 py-2 font-medium", LABEL_CLASS, "text-[var(--text-tertiary)]")}>
                Type
              </th>
              {brands.map((b) => (
                <th
                  key={b.id}
                  className={cn("px-3 py-2 font-medium", LABEL_CLASS, "text-[var(--text-tertiary)]")}
                >
                  {b.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 text-[var(--text-secondary)]">{row}</td>
                {brands.map((b) => (
                  <td key={b.id} className={cn("px-3 py-2", VALUE_CLASS, "text-[var(--text-primary)]")}>
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
        "space-y-6 border-t border-[var(--border)] py-5",
        className,
      )}
    >
      <h2 className="type-title text-[var(--text-primary)]">
        Comparison matrix
      </h2>
      {table("Hook type distribution", HOOK_TYPES, hookDist)}
      {table("Funnel stage distribution", FUNNEL_STAGES, funnelDist)}
    </section>
  );
}
