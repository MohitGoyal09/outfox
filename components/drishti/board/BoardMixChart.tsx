"use client";

import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../EmptyState";
import { hookName } from "../labels";
import { Panel } from "../Panel";
import { HOOK_COLOR, VALUE_CLASS, iconProps } from "../tokens";
import type { DistributionItem } from "../DistributionPanel";

const config = {
  findings: { label: "Findings", color: "var(--accent)" },
} satisfies ChartConfig;

export function BoardMixChart({ items }: { items: DistributionItem[] }) {
  const data = items
    .filter(
      (item): item is DistributionItem & { count: number } =>
        typeof item.count === "number" && item.count > 0,
    )
    .map((item) => ({
      label: hookName(item.label),
      findings: item.count,
      fill: HOOK_COLOR[item.label as keyof typeof HOOK_COLOR] ?? "var(--accent)",
    }));
  const total = data.reduce((sum, row) => sum + row.findings, 0);

  return (
    <Panel interactive={false} className="flex flex-col" ariaLabel="Hook mix">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h3 className="type-headline text-fg">Hook mix</h3>
          <p className="mt-1 type-caption text-fg-secondary">
            How much evidence each hook has in this check.
          </p>
        </div>
        <span className={cn(VALUE_CLASS, "text-[11px] tabular-nums text-fg-tertiary")}>
          {total} {total === 1 ? "finding" : "findings"} · {data.length}{" "}
          {data.length === 1 ? "hook" : "hooks"}
        </span>
      </header>
      <div className="p-4">
        {data.length === 0 ? (
          <EmptyState
            size="sm"
            bounded
            icon={<BarChart3 {...iconProps} size={16} />}
            title="No hook evidence in this check yet."
            description="Every finding carries a hook. The mix appears here once at least one source returns a hook."
          />
        ) : (
          <ChartContainer config={config} className="h-52 w-full aspect-auto">
            <BarChart accessibilityLayer data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={46} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={30} />
              <ChartTooltip cursor={{ fill: "var(--bg-inset)", opacity: 0.6 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="findings" radius={[4, 4, 0, 0]} fill="var(--color-findings)">
                {data.map((row) => <Cell key={row.label} fill={row.fill} />)}
                <LabelList
                  dataKey="findings"
                  position="top"
                  fill="var(--text-tertiary)"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </Panel>
  );
}
