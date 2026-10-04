"use client";

import { Tag, Filter, type LucideIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { hookName, stageName } from "@/components/drishti/labels";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { DONUT_MIN_DISTINCT, FUNNEL_COLOR, FUNNEL_STAGE_INDEX, HOOK_COLOR, CONTROL_SHELL_CLASS, FOCUS_RING_CLASS, VALUE_CLASS, iconProps, type FunnelStage, type HookType } from "../tokens";
export { DONUT_MIN_DISTINCT };
import type { DistributionItem } from "../DistributionPanel";
import { DeltaMark } from "../DeltaMark";
import { countChange } from "./panel-rules";


export function ScaleDot({ color }: { color: string }) {
  return <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

const MENU_CLASS =
  "min-w-(--radix-select-trigger-width) rounded-sm border border-border bg-bg-raised text-fg shadow-[var(--shadow-lg)] ring-0 [&_[data-radix-select-viewport]]:h-auto! [&_[data-radix-select-viewport]]:p-1";
const ITEM_CLASS =
  "rounded-sm py-1.5 text-xs focus:bg-bg-inset focus:text-fg not-data-[variant=destructive]:focus:**:text-fg data-[state=checked]:font-medium";

export function FilterSelect({ icon: Icon, label, value, onChange, options, optionIcon, includeAll = true }: { icon: LucideIcon; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; optionIcon?: (value: string) => ReactNode; /** false for a control with no "all" state (Sort): `options` is the full list and `label` the accessible name only. */ includeAll?: boolean }) {
  const iconFor = (optionValue: string): ReactNode => (optionIcon ? (optionIcon(optionValue) ?? (optionValue === "all" ? <Icon aria-hidden className="size-3.5 text-muted-foreground" /> : null)) : null);
  const all = includeAll ? [{ value: "all", label }, ...options] : options;
  const selectedLabel = all.find((option) => option.value === value)?.label ?? label;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(CONTROL_SHELL_CLASS, "group w-fit data-[size=default]:h-9 font-normal text-foreground hover:bg-bg-raised dark:bg-bg-raised dark:hover:bg-bg-raised active:scale-[0.98] motion-reduce:active:scale-100", FOCUS_RING_CLASS)}
      >
        <Icon aria-hidden className="size-3.5 text-fg-secondary" />
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={6} align="start" className={MENU_CLASS}>
        {all.map((option) => (
          <SelectItem key={option.value} value={option.value} className={ITEM_CLASS}>
            {iconFor(option.value)}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DeltaTag({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const change = countChange(delta);
  if (change === null) return <span className="font-mono text-[10px] text-muted-foreground">±0</span>;
  return (
    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
      <DeltaMark direction={change.direction} />
      {Intl.NumberFormat("en-US").format(change.amount)}
    </span>
  );
}

export function SummaryPanel({ title, subtitle, children, className }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Panel interactive={false} className={cn("flex min-h-[206px] flex-col overflow-hidden", className)}>
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-fg">{title}</h3>
        {subtitle}
      </div>
      <div className="px-4 py-4">{children}</div>
    </Panel>
  );
}


function hookRow(row: DistributionItem): DistributionItem & { count: number } {
  return { label: row.label, count: row.count ?? 0, sharePct: null, delta: row.delta };
}

function isRowSelected(value: string, selected?: string): boolean {
  return selected !== undefined && selected !== "all" && selected === value;
}

function HookRow({
  row,
  total,
  selectedHook,
  onSelectHook,
}: {
  row: DistributionItem & { count: number };
  total: number;
  selectedHook?: string;
  onSelectHook?: (hookType: string) => void;
}) {
  const selected = isRowSelected(row.label, selectedHook);
  const content = (
    <>
      <span className="flex min-w-0 items-start gap-2">
        <span className="mt-1 size-2 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable }} />
        <span className="min-w-0 break-words">{hookName(row.label)}</span>
      </span>
      <span className="font-mono tabular-nums text-muted-foreground">{Intl.NumberFormat("en-US").format(row.count)}</span>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{total ? `${Math.round((row.count / total) * 100)}%` : "-"}</span>
      <DeltaTag delta={row.delta} />
    </>
  );
  if (!onSelectHook) {
    return <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-[11px]">{content}</div>;
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? `Clear ${hookName(row.label)} hook type filter` : `Filter evidence to ${hookName(row.label)} hook type`}
      onClick={() => onSelectHook(row.label)}
      className={cn(
        "grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-sm text-left text-[11px] hover:bg-muted/40",
        selected && "bg-accent/10",
        FOCUS_RING_CLASS,
      )}
    >
      {content}
    </button>
  );
}

function TaggedShareNote({
  realCount,
  taggedCount,
  totalFindings,
  dimensionNoun,
}: {
  realCount: number;
  taggedCount: number;
  totalFindings?: number | null;
  dimensionNoun: string;
}) {
  const num = (n: number) => <span className={cn(VALUE_CLASS, "text-fg")}>{Intl.NumberFormat("en-US").format(n)}</span>;
  const hasFindings = totalFindings != null && totalFindings > 0;
  return (
    <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
      {num(realCount)} of {num(taggedCount)} tagged finding{taggedCount === 1 ? "" : "s"} carry a real {dimensionNoun}
      {hasFindings ? <>, {num(taggedCount)} of {num(totalFindings as number)} finding{totalFindings === 1 ? "" : "s"} were tagged at all</> : null}
      . Shares above are of those {num(realCount)}, not of every tagged finding{hasFindings ? " or every finding" : ""}.
    </p>
  );
}

function HookFallback({
  rows,
  total,
  taggedCount,
  totalFindings,
  selectedHook,
  onSelectHook,
}: {
  rows: DistributionItem[];
  total: number;
  taggedCount: number;
  totalFindings?: number | null;
  selectedHook?: string;
  onSelectHook?: (hookType: string) => void;
}) {
  if (rows.length === 1) {
    const row = rows[0];
    const selected = isRowSelected(row.label, selectedHook);
    const stat = (
      <div className="flex items-center gap-3">
        <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable }} />
        <div>
          <p className="font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">{Intl.NumberFormat("en-US").format(row.count ?? 0)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hookName(row.label)}</p>
        </div>
      </div>
    );
    if (!onSelectHook) return stat;
    return (
      <button
        type="button"
        aria-pressed={selected}
        aria-label={selected ? `Clear ${hookName(row.label)} hook type filter` : `Filter evidence to ${hookName(row.label)} hook type`}
        onClick={() => onSelectHook(row.label)}
        className={cn("rounded-sm p-1 text-left hover:bg-muted/40", selected && "bg-accent/10", FOCUS_RING_CLASS)}
      >
        {stat}
      </button>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <HookRow key={row.label} row={hookRow(row)} total={total} selectedHook={selectedHook} onSelectHook={onSelectHook} />
      ))}
      {total > 0 ? <TaggedShareNote realCount={total} taggedCount={taggedCount} totalFindings={totalFindings} dimensionNoun="hook" /> : null}
    </div>
  );
}

export function HookChart({
  items,
  taggedCount,
  totalFindings,
  selectedHook,
  onSelectHook,
}: {
  items: DistributionItem[];
  taggedCount: number;
  totalFindings?: number | null;
  selectedHook?: string;
  onSelectHook?: (hookType: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const rows = [...items].map(hookRow).filter((row) => row.count > 0).sort((a, b) => b.count - a.count).slice(0, 9);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (rows.length === 0) return (
    <EmptyState
      size="sm"
      icon={<Tag {...iconProps} size={16} />}
      title="No hook tags in this check."
      description="Hook types are assigned by an enrichment pass after a check runs. This check carries none yet."
    />
  );
  if (rows.length < DONUT_MIN_DISTINCT) return <HookFallback rows={rows} total={total} taggedCount={taggedCount} totalFindings={totalFindings} selectedHook={selectedHook} onSelectHook={onSelectHook} />;
  const chartConfig = Object.fromEntries(
    rows.map((row) => [row.label, { label: hookName(row.label), color: HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable }]),
  ) satisfies ChartConfig;
  return (
    <div className="grid items-center gap-4">
      {/* No hover tooltip on purpose. The legend to the right already carries
          every slice's label, count, share and delta, so a tooltip repeats it
          -- and at 92px a cursor-following card lands squarely on the centre
          label, hiding the tagged total it exists to show. */}
      <div className="relative mx-auto size-[92px]">
        <ChartContainer config={chartConfig} className="aspect-square size-[92px]">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="label" innerRadius={26} outerRadius={44} strokeWidth={1} isAnimationActive={!reduceMotion}>
              {rows.map((row) => {
                const selected = isRowSelected(row.label, selectedHook);
                return (
                  <Cell
                    key={row.label}
                    fill={HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable}
                    stroke={selected ? "var(--accent)" : undefined}
                    strokeWidth={selected ? 3 : 1}
                    className={onSelectHook ? "cursor-pointer" : undefined}
                    onClick={onSelectHook ? () => onSelectHook(row.label) : undefined}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{Intl.NumberFormat("en-US").format(total)}</span>
          {/* Was "EVIDENCE", then "TAGGED", both read as the brand's tagged-
              findings count (the header badge's own word, `taggedCount`
              below), which this total is not: `not_applicable` findings are
              tagged too but excluded from this donut, so `total` is only the
              REAL-hook subset of the tagged sample (docs/HANDOFF.md §2 /
              §10's honest-percentages rule, "tagged" only ever means
              `taggedCount` on this page now). */}
          <span className="text-[11px] font-medium text-fg-secondary">with hook</span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <HookRow key={row.label} row={row} total={total} selectedHook={selectedHook} onSelectHook={onSelectHook} />
        ))}
      </div>
      {total > 0 ? (
        <div>
          <TaggedShareNote realCount={total} taggedCount={taggedCount} totalFindings={totalFindings} dimensionNoun="hook" />
        </div>
      ) : null}
    </div>
  );
}

const FUNNEL_ORDER: readonly [FunnelStage, string][] = (
  ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"] as const
).map((stage) => [stage, stageName(stage)]);

const FUNNEL_EMPTY_BAND_PCT = 4;

export function FunnelPanel({
  items,
  taggedCount,
  totalFindings,
  selectedStage,
  onSelectStage,
}: {
  items: DistributionItem[];
  taggedCount: number;
  totalFindings?: number | null;
  selectedStage?: string;
  onSelectStage?: (stage: FunnelStage) => void;
}) {
  const byLabel = new Map(items.map((item) => [item.label, item]));
  const rows = FUNNEL_ORDER.map(([stage, label]) => ({
    stage,
    label,
    count: byLabel.get(stage)?.count ?? 0,
    delta: byLabel.get(stage)?.delta ?? null,
  }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return (
    <EmptyState
      size="sm"
      icon={<Filter {...iconProps} size={16} />}
      title="No funnel-stage tags yet."
      description="Funnel stages are assigned by an enrichment pass after a check runs. This check carries none yet."
    />
  );
  return (
    <div
      className="space-y-1.5"
      role={onSelectStage ? "group" : "img"}
      aria-label={
        onSelectStage
          ? "Awareness-stage distribution, activate a stage to filter evidence to it"
          : "Awareness-stage distribution, one bar per stage from a shared left baseline"
      }
    >
      {rows.map((row) => {
        const sharePct = total ? Math.round((row.count / total) * 100) : 0;
        const widthPct = row.count > 0 ? Math.max(2, sharePct) : FUNNEL_EMPTY_BAND_PCT;
        const selected = isRowSelected(row.stage, selectedStage);
        const bar = (
          <>
            <span className="col-span-3 min-w-0 break-words">{FUNNEL_STAGE_INDEX[row.stage] + 1}. {row.label}</span>
            <span className="h-4 w-full overflow-hidden rounded-[3px] bg-muted/40">
              {row.count > 0 ? (
                <span
                  className={cn("block h-full rounded-[3px]", selected && "ring-2 ring-inset ring-[var(--accent)]")}
                  style={{ width: `${widthPct}%`, backgroundColor: FUNNEL_COLOR[row.stage] }}
                />
              ) : (
                <span className="block h-full rounded-[3px] border border-dashed border-border-strong/70" style={{ width: `${widthPct}%` }} />
              )}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{total ? `${sharePct}%` : "-"}</span>
            <DeltaTag delta={row.delta} />
          </>
        );
        if (row.count === 0 || !onSelectStage) {
          return (
            <div key={row.stage} className="grid grid-cols-[1fr_auto_auto] gap-y-1 items-center gap-2 text-[11px]">
              {bar}
            </div>
          );
        }
        return (
          <button
            key={row.stage}
            type="button"
            aria-pressed={selected}
            aria-label={selected ? `Clear ${row.label} funnel stage filter` : `Filter evidence to ${row.label} funnel stage`}
            onClick={() => onSelectStage(row.stage)}
            className={cn(
              "grid grid-cols-[1fr_auto_auto] gap-y-1 items-center gap-2 rounded-sm text-left text-[11px] hover:bg-muted/40",
              selected && "bg-accent/10",
              FOCUS_RING_CLASS,
            )}
          >
            {bar}
          </button>
        );
      })}
      <TaggedShareNote realCount={total} taggedCount={taggedCount} totalFindings={totalFindings} dimensionNoun="audience stage" />
    </div>
  );
}
