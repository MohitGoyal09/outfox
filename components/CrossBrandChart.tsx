"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { VALUE_CLASS } from "@/components/drishti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CrossBrandChart({
  brands,
  claims,
  loading = false,
  className,
}: {
  brands: { id: string; name: string }[];
  claims: { brandId: string }[] | undefined;
  loading?: boolean;
  className?: string;
}) {
  if (loading || claims === undefined) {
    return (
      <div className={cn("flex items-center gap-2 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        <Spinner className="size-4" /> Loading chart.
      </div>
    );
  }
  if (brands.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        No brands to chart yet.
      </div>
    );
  }
  const counts = brands.map((b) => ({
    ...b,
    count: claims.filter((c) => c.brandId === b.id).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));
  if (counts.every((c) => c.count === 0)) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        No stored claims to chart. Refresh the cohort to collect evidence.
      </div>
    );
  }
  return (
    <Card aria-label="Cross brand claim counts" className={cn("border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4"><CardTitle className="text-sm font-semibold tracking-[-0.01em]">Claims per brand</CardTitle></CardHeader>
      <CardContent className="p-5">
      <ul className="mt-3 space-y-3">
        {counts.map((row) => (
          <li key={row.id}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-[var(--text-primary)]">{row.name}</span>
              <span className={cn(VALUE_CLASS, "text-[var(--text-secondary)]")}>{row.count}</span>
            </div>
            <div
              className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-inset)]"
              role="img"
              aria-label={`${row.name} has ${row.count} claims`}
            >
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.round((row.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      </CardContent>
    </Card>
  );
}
