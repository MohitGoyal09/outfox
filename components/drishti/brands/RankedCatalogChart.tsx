"use client";

import { Layers } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../EmptyState";
import { iconProps } from "../tokens";
import type { LabeledCount } from "./brand-model";

export function RankedCatalogChart({ title, rows, emptyTitle, emptyDescription, colorFor }: { title: string; rows: LabeledCount[]; emptyTitle: string; emptyDescription: string; colorFor?: (label: string) => string }) {
  const top = rows.slice(0, 8);
  const chartConfig = { count: { label: "Times assigned", color: "#0f766e" } } satisfies ChartConfig;
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/70">
        <CardTitle className="text-sm">{title}</CardTitle>
        {rows.length > 0 ? <span className="font-mono text-[11px] text-muted-foreground">{rows.length} distinct</span> : null}
      </CardHeader>
      <CardContent className="pt-4">
        {top.length === 0 ? (
          <EmptyState size="sm" icon={<Layers {...iconProps} size={16} />} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full aspect-auto">
            <BarChart accessibilityLayer data={top} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis dataKey="label" type="category" width={160} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={3} barSize={16}>
                {colorFor ? top.map((row) => <Cell key={row.label} fill={colorFor(row.label)} />) : null}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
