"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { HOOK_COLOR, VALUE_CLASS } from "../tokens";
import type { DistributionItem } from "../DistributionPanel";

const config = {
  claims: { label: "Claims", color: "var(--accent, #0f766e)" },
} satisfies ChartConfig;

export function BoardMixChart({ items }: { items: DistributionItem[] }) {
  const data = items
    .filter((item) => typeof item.count === "number" && item.count > 0)
    .map((item) => ({
      label: item.label.replaceAll("_", " "),
      claims: item.count,
      fill: HOOK_COLOR[item.label as keyof typeof HOOK_COLOR] ?? "var(--accent, #0f766e)",
    }));

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-none">
      <CardHeader className="border-b border-border/70 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Hook mix</CardTitle>
            <CardDescription className="mt-1">Evidence volume by creative hook in this run.</CardDescription>
          </div>
          <span className={`${VALUE_CLASS} text-xs text-muted-foreground`}>{data.length} signals</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-5">
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No hook evidence in this run.</div>
        ) : (
          <ChartContainer config={config} className="h-52 w-full aspect-auto">
            <BarChart accessibilityLayer data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={46} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={30} />
              <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.35 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="claims" radius={[4, 4, 0, 0]} fill="var(--color-claims)" />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
