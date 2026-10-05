"use client";

import { BarChart3 } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../EmptyState";
import { hookName } from "../labels";
import { SectionHeader } from "../SectionHeader";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { HOOK_COLOR, VALUE_CLASS, iconProps } from "../tokens";
import type { DistributionItem } from "../DistributionPanel";
import { DeltaMark } from "../DeltaMark";
import type { EmergingMove } from "./board-model";

const config = {
  findings: { label: "Findings", color: "var(--accent)" },
} satisfies ChartConfig;

export function BoardMixChart({
  items,
  unclearCount = 0,
  loading = false,
  moves = [],
  changeNote,
}: {
  moves?: EmergingMove[];
  changeNote?: string;
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
  const changeRows = moves.filter((move) => move.deltaPct !== null);
  const total = data.reduce((sum, row) => sum + row.findings, 0);

  return (
    <Panel interactive={false} className="flex flex-col" ariaLabel="Hook mix">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <SectionHeader as="h3" title="Hook mix" sub="How much evidence each hook has in this check." />
        {loading ? null : (
          <span className={cn(VALUE_CLASS, "text-xs tabular-nums text-fg-tertiary")}>
            {Intl.NumberFormat("en-US").format(total)} with a clear hook · {data.length}{" "}
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
          <ChartContainer
            config={config}
            className="w-full aspect-auto"
            style={{ height: Math.max(160, data.length * 34 + 16) }}
          >
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={data}
              margin={{ top: 4, right: 32, left: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide allowDecimals={false} />
              {/* Category names sit on the left at a fixed width, so a long hook
                  name ("Problem and solution") is never clipped or rotated. */}
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={132}
                interval={0}
                tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
              />
              <ChartTooltip cursor={{ fill: "var(--bg-inset)", opacity: 0.6 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="findings" radius={[0, 4, 4, 0]} fill="var(--color-findings)" isAnimationActive={!reduceMotion}>
                {data.map((row) => <Cell key={row.label} fill={row.fill} />)}
                <LabelList
                  dataKey="findings"
                  position="right"
                  fill="var(--text-tertiary)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
        {!loading && unclearCount > 0 ? (
          <p className="mt-3 text-[12px] leading-[1.5] text-fg-secondary">
            {Intl.NumberFormat("en-US").format(unclearCount)} {unclearCount === 1 ? "finding had" : "findings had"} no clear hook and{" "}
            {unclearCount === 1 ? "is" : "are"} not charted.
          </p>
        ) : null}
      </div>
      {!loading && changeRows.length > 0 ? (
        <div className="border-t border-border px-5 py-3">
          <table className="w-full text-[13px]">
            <caption className="pb-1.5 text-left type-caption text-fg-secondary">
              Change in share of findings with a clear hook, since each brand&apos;s previous check
              {changeNote ? ` · ${changeNote}` : ""}.
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Hook</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {changeRows.map((move) => (
                <tr key={move.hook}>
                  <td className="py-1.5 text-fg">{hookName(move.hook)}</td>
                  <td className={cn(VALUE_CLASS, "py-1.5 text-right text-fg-secondary")}>
                    {move.deltaGlyph ? <DeltaMark direction={move.deltaGlyph} /> : null}
                    {move.deltaText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}
