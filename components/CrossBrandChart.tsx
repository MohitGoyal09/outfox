"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { VALUE_CLASS } from "@/components/drishti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
      <CardHeader className="border-b border-border/70 px-5 py-4"><CardTitle className="text-sm font-semibold tracking-[-0.01em]">Claims per brand</CardTitle><p className="text-xs text-muted-foreground">Stored evidence by rival</p></CardHeader>
      <CardContent className="p-5">
      <ChartContainer config={{ claims: { label: "Claims", color: "#0f766e" } } satisfies ChartConfig} className="h-[220px] w-full aspect-auto">
        <BarChart data={counts} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} domain={[0, Math.max(1, max)]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <ChartTooltip cursor={{ fill: "hsl(var(--muted) / .5)" }} content={<ChartTooltipContent />} />
          <Bar dataKey="count" name="Claims" fill="var(--color-claims)" radius={[5, 5, 0, 0]} maxBarSize={46} />
        </BarChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {counts.map((row) => <span key={row.id} className={cn(VALUE_CLASS, "tabular-nums")}>{row.name}: {row.count}</span>)}
      </div>
      </CardContent>
    </Card>
  );
}
