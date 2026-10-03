"use client";

import { BarChart3 } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../EmptyState";
import { hookName } from "../labels";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { HOOK_COLOR, VALUE_CLASS, iconProps } from "../tokens";
import type { DistributionItem } from "../DistributionPanel";

const config = {
  findings: { label: "Findings", color: "var(--accent)" },
} satisfies ChartConfig;

export function BoardMixChart({
  items,
  unclearCount = 0,
  loading = false,
}: {
  items: DistributionItem[];
  unclearCount?: number;
  loading?: boolean;
}) {
  const reduceMotion = useReducedMotion();
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
        {loading ? null : (
          <span className={cn(VALUE_CLASS, "text-[11px] tabular-nums text-fg-tertiary")}>
            {total} with a clear hook · {data.length}{" "}
            {data.length === 1 ? "hook" : "hooks"}
          </span>
        )}
      </header>
      <div className="p-4">
        {loading ? (
          <SkeletonRegion label="Loading hook mix">
            <Skeleton variant="block" height={208} />
          </SkeletonRegion>
        ) : data.length === 0 ? (
          <EmptyState
            size="sm"
            bounded
            icon={<BarChart3 {...iconProps} size={16} />}
            title="No hook evidence in this check yet."
            description="Every tagged finding carries a hook. The mix appears here once at least one finding has been tagged."
          />
        ) : (
          <ChartContainer config={config} className="h-52 w-full aspect-auto">
            <BarChart accessibilityLayer data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={46} />
              {/* width 30 fits two digits; a three-digit count (154 live) clipped to a
                  single glyph stub, so the axis read ") ) ) )". */}
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={42} />
              <ChartTooltip cursor={{ fill: "var(--bg-inset)", opacity: 0.6 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="findings" radius={[4, 4, 0, 0]} fill="var(--color-findings)" isAnimationActive={!reduceMotion}>
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
        {!loading && unclearCount > 0 ? (
          <p className="mt-3 text-[12px] leading-[1.5] text-fg-secondary">
            {unclearCount} {unclearCount === 1 ? "finding had" : "findings had"} no clear hook and{" "}
            {unclearCount === 1 ? "is" : "are"} not charted.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
