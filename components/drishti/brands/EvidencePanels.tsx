"use client";

import { ChevronDown, Tag, Filter, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { hookName } from "@/components/drishti/labels";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { FUNNEL_COLOR, FUNNEL_STAGE_INDEX, HOOK_COLOR, CONTROL_SHELL_CLASS, FOCUS_RING_CLASS, VALUE_CLASS, iconProps, type FunnelStage, type HookType } from "../tokens";
import type { DistributionItem } from "../DistributionPanel";


export function FilterSelect({ icon: Icon, label, value, onChange, options }: { icon: LucideIcon; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className={cn(CONTROL_SHELL_CLASS, "group gap-2 active:scale-[0.98] motion-reduce:active:scale-100")}>
      <Icon className="size-3.5" />
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="appearance-none bg-transparent text-xs font-normal text-foreground outline-none focus:outline-none focus-visible:outline-none">
        <option value="all">{label}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="size-3 transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:rotate-180 motion-reduce:transition-none motion-reduce:group-focus-within:rotate-0" />
    </label>
  );
}

export function DeltaTag({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta === 0) return <span className="font-mono text-[10px] text-muted-foreground">±0</span>;
  const positive = delta > 0;
  return <span className={cn("font-mono text-[10px]", positive ? "text-ok" : "text-danger")}>{positive ? "+" : ""}{delta}</span>;
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

export const DONUT_MIN_DISTINCT = 3;

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
      <span className="flex min-w-0 items-center gap-2 capitalize">
        <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable }} />
        <span className="truncate">{hookName(row.label)}</span>
      </span>
      <span className="font-mono tabular-nums text-muted-foreground">{Intl.NumberFormat("en-US").format(row.count)}</span>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{total ? `${Math.round((row.count / total) * 100)}%` : "—"}</span>
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

function TaggedShareNote({ shown, totalFindings }: { shown: number; totalFindings?: number | null }) {
  const shownText = <span className={cn(VALUE_CLASS, "text-fg")}>{Intl.NumberFormat("en-US").format(shown)}</span>;
  return (
    <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
      {totalFindings != null && totalFindings > 0 ? (
        <>
          {shownText} of{" "}
          <span className={cn(VALUE_CLASS, "text-fg")}>{Intl.NumberFormat("en-US").format(totalFindings)}</span>{" "}
          finding{totalFindings === 1 ? "" : "s"} tagged — shares above are of that tagged sample, not of all findings.
        </>
      ) : (
        <>Shares above are of {shownText} tagged finding{shown === 1 ? "" : "s"}, not of all findings.</>
      )}
    </p>
  );
}

function HookFallback({
  rows,
  total,
  totalFindings,
  selectedHook,
  onSelectHook,
}: {
  rows: DistributionItem[];
  total: number;
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
          <p className="mt-1 text-[11px] capitalize text-muted-foreground">{hookName(row.label)}</p>
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
      {total > 0 ? <TaggedShareNote shown={total} totalFindings={totalFindings} /> : null}
    </div>
  );
}

export function HookChart({
  items,
  totalFindings,
  selectedHook,
  onSelectHook,
}: {
  items: DistributionItem[];
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
  if (rows.length < DONUT_MIN_DISTINCT) return <HookFallback rows={rows} total={total} totalFindings={totalFindings} selectedHook={selectedHook} onSelectHook={onSelectHook} />;
  const chartConfig = Object.fromEntries(
    rows.map((row) => [row.label, { label: hookName(row.label), color: HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable }]),
  ) satisfies ChartConfig;
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-4">
      <div className="relative mx-auto size-[92px]">
        <ChartContainer config={chartConfig} className="aspect-square size-[92px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
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
          {/* Was "EVIDENCE" — read as the brand's total evidence count, which
              this is not: it is only the tagged sample the shares below
              divide by (docs/HANDOFF.md §2, "a bounded query cannot assert
              absence"/a whole-corpus claim). */}
          <span className="text-[7px] uppercase tracking-wide text-muted-foreground">tagged</span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <HookRow key={row.label} row={row} total={total} selectedHook={selectedHook} onSelectHook={onSelectHook} />
        ))}
      </div>
      {total > 0 ? (
        <div className="col-span-2">
          <TaggedShareNote shown={total} totalFindings={totalFindings} />
        </div>
      ) : null}
    </div>
  );
}

const FUNNEL_ORDER: readonly [FunnelStage, string][] = [
  ["unaware", "Awareness"],
  ["problem_aware", "Problem aware"],
  ["solution_aware", "Solution aware"],
  ["product_aware", "Product aware"],
  ["most_aware", "Most aware"],
];

const FUNNEL_EMPTY_BAND_PCT = 4;

export function FunnelPanel({
  items,
  totalFindings,
  selectedStage,
  onSelectStage,
}: {
  items: DistributionItem[];
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
          ? "Awareness-stage distribution — activate a stage to filter evidence to it"
          : "Awareness-stage distribution, one bar per stage from a shared left baseline"
      }
    >
      {rows.map((row) => {
        const sharePct = total ? Math.round((row.count / total) * 100) : 0;
        const widthPct = row.count > 0 ? Math.max(2, sharePct) : FUNNEL_EMPTY_BAND_PCT;
        const selected = isRowSelected(row.stage, selectedStage);
        const bar = (
          <>
            <span className="truncate">{FUNNEL_STAGE_INDEX[row.stage] + 1}. {row.label}</span>
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
            <span className="font-mono tabular-nums text-muted-foreground">{total ? `${sharePct}%` : "—"}</span>
            <DeltaTag delta={row.delta} />
          </>
        );
        if (row.count === 0 || !onSelectStage) {
          return (
            <div key={row.stage} className="grid grid-cols-[100px_1fr_auto_auto] items-center gap-2 text-[11px]">
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
              "grid grid-cols-[100px_1fr_auto_auto] items-center gap-2 rounded-sm text-left text-[11px] hover:bg-muted/40",
              selected && "bg-accent/10",
              FOCUS_RING_CLASS,
            )}
          >
            {bar}
          </button>
        );
      })}
      <TaggedShareNote shown={total} totalFindings={totalFindings} />
    </div>
  );
}
