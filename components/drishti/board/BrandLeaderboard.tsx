import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "../EmptyState";
import { hookName } from "../labels";
import { SectionHeader } from "../SectionHeader";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { HOOK_COLOR, LABEL_CLASS, VALUE_CLASS, iconProps, type HookType } from "../tokens";
import { LEADERBOARD_RULE_LINE, type BrandLeader, type HookComparisonLine } from "./board-model";

export function BrandLeaderboard({
  rows,
  totalClaims,
  comparison = null,
  loading = false,
  className,
}: {
  rows: BrandLeader[];
  totalClaims: number;
  comparison?: HookComparisonLine | null;
  loading?: boolean;
  className?: string;
}) {
  const ownRow = rows.find((row) => row.isOwnBrand) ?? null;
  const rivalRows = rows.filter((row) => !row.isOwnBrand);
  return (
    <Panel interactive={false} className={cn("flex flex-col", className)} ariaLabel="Evidence volume">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <SectionHeader as="h3" title="Evidence volume" sub={LEADERBOARD_RULE_LINE} />
        {loading ? null : (
          <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>
            {rows.length} {rows.length === 1 ? "brand" : "brands"} ·{" "}
            {Intl.NumberFormat("en-US").format(totalClaims)} findings
          </Badge>
        )}
      </header>

      {loading ? (
        <div className="p-4">
          <SkeletonRows count={4} variant="row" height={40} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState
            size="sm"
            bounded
            icon={<Users {...iconProps} size={16} />}
            title="No brand has findings in this check yet."
            description="A brand appears here once at least one source returns a finding for it. Ranking is by finding volume, then source breadth."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(LABEL_CLASS, "w-16 pl-5 text-fg-tertiary")}>Rank</TableHead>
              <TableHead className={cn(LABEL_CLASS, "text-fg-tertiary")}>Brand</TableHead>
              <TableHead className={cn(LABEL_CLASS, "text-right text-fg-tertiary")}>Findings</TableHead>
              <TableHead className={cn(LABEL_CLASS, "text-right text-fg-tertiary")}>Sources</TableHead>
              <TableHead className={cn(LABEL_CLASS, "hidden pr-5 text-right text-fg-tertiary md:table-cell")}>
                Leading hook
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownRow ? <LeaderRow row={ownRow} /> : null}
            {rivalRows.map((row, index) => (
              <LeaderRow key={row.brandId} row={row} dividerAbove={ownRow !== null && index === 0} />
            ))}
          </TableBody>
        </Table>
      )}

      {comparison ? (
        <p className="border-t border-border px-5 py-3 text-[13px] leading-[1.5] text-fg-secondary">
          {comparison.text}
        </p>
      ) : null}
    </Panel>
  );
}

function LeaderRow({ row, dividerAbove = false }: { row: BrandLeader; dividerAbove?: boolean }) {
  return (
    <TableRow
      className={cn(
        row.isOwnBrand && "bg-bg-inset hover:bg-bg-inset",
        dividerAbove && "border-t-2 border-border",
      )}
    >
      <TableCell className={cn(VALUE_CLASS, "pl-5 text-fg-tertiary")}>
        {row.isOwnBrand ? (
          <Badge variant="outline" className="font-normal">You</Badge>
        ) : (
          String(row.rank).padStart(2, "0")
        )}
      </TableCell>
      <TableCell
        className={cn(
          "max-w-[18rem] whitespace-normal text-fg",
          row.isOwnBrand ? "font-semibold" : "font-medium",
        )}
      >
        {row.brandName}
      </TableCell>
      <TableCell className={cn(VALUE_CLASS, "text-right text-fg")}>
        {Intl.NumberFormat("en-US").format(row.claimCount)}
      </TableCell>
      <TableCell className={cn(VALUE_CLASS, "text-right text-fg-secondary")}>{row.engineCount}</TableCell>
      <TableCell className="hidden pr-5 text-right md:table-cell">
        {row.topHook ? (
          <Badge variant="secondary" className="font-normal">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-sm"
              style={{ backgroundColor: HOOK_COLOR[row.topHook as HookType] ?? HOOK_COLOR.not_applicable }}
            />
            {hookName(row.topHook)} · {row.topHookCount}
          </Badge>
        ) : (
          <span className="text-fg-tertiary">No clear hook yet</span>
        )}
      </TableCell>
    </TableRow>
  );
}
