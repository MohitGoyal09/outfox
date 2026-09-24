import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SkeletonRows } from "../Skeleton";
import { VALUE_CLASS, iconProps } from "../tokens";
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
    <Card className={cn("overflow-hidden border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Brand leaderboard</CardTitle>
            <CardDescription className="mt-1">{LEADERBOARD_RULE_LINE}</CardDescription>
          </div>
          {loading ? null : (
            <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>{rows.length} brands · {Intl.NumberFormat("en-US").format(totalClaims)} findings</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">

      {loading ? (
        <div>
          <SkeletonRows count={4} variant="row" height={40} />
        </div>
      ) : rows.length === 0 ? (
        <div>
          <EmptyState
            size="sm"
            bounded
            icon={<Users {...iconProps} size={16} />}
            title="No brand has findings in this check yet."
            description="A brand appears here once at least one source returns a finding for it. Ranking is by finding volume, then source breadth."
          />
        </div>
      ) : (
        <div className="mt-3">
            <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-16 pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Rank</TableHead><TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Brand</TableHead><TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Findings</TableHead><TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Sources</TableHead><TableHead className="hidden pr-5 text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:table-cell">Leading hook</TableHead></TableRow></TableHeader>
            <TableBody>
              {ownRow ? <LeaderRow row={ownRow} /> : null}
              {rivalRows.map((row, index) => (
                <LeaderRow key={row.brandId} row={row} dividerAbove={ownRow !== null && index === 0} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {comparison ? (
        <p className="border-t border-border/70 px-5 py-3 text-[13px] leading-[1.5] text-fg-secondary">
          {comparison.text}
        </p>
      ) : null}
      </CardContent>
    </Card>
  );
}

function LeaderRow({ row, dividerAbove = false }: { row: BrandLeader; dividerAbove?: boolean }) {
  return (
    <TableRow
      className={cn(
        row.isOwnBrand && "bg-muted/40 hover:bg-muted/40",
        dividerAbove && "border-t-2 border-border",
      )}
    >
      <TableCell className={cn(VALUE_CLASS, "pl-5 text-muted-foreground")}>
        {row.isOwnBrand ? (
          <Badge variant="outline" className="font-normal">You</Badge>
        ) : (
          String(row.rank).padStart(2, "0")
        )}
      </TableCell>
      <TableCell
        className={cn(
          "max-w-[18rem] whitespace-normal text-foreground",
          row.isOwnBrand ? "font-semibold" : "font-medium",
        )}
      >
        {row.brandName}
      </TableCell>
      <TableCell className={cn(VALUE_CLASS, "text-right text-foreground")}>
        {Intl.NumberFormat("en-US").format(row.claimCount)}
      </TableCell>
      <TableCell className={cn(VALUE_CLASS, "text-right text-muted-foreground")}>{row.engineCount}</TableCell>
      <TableCell className="hidden pr-5 text-right md:table-cell">
        {row.topHook ? (
          <Badge variant="secondary" className="font-normal">{hookName(row.topHook)} · {row.topHookCount}</Badge>
        ) : (
          <span className="text-muted-foreground">Not tagged</span>
        )}
      </TableCell>
    </TableRow>
  );
}
