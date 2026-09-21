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
import { SkeletonRows } from "../Skeleton";
import { VALUE_CLASS, iconProps } from "../tokens";
import { LEADERBOARD_RULE_LINE, type BrandLeader } from "./board-model";

export function BrandLeaderboard({
  rows,
  totalClaims,
  loading = false,
  className,
}: {
  rows: BrandLeader[];
  totalClaims: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Brand leaderboard</CardTitle>
            <CardDescription className="mt-1">{LEADERBOARD_RULE_LINE}</CardDescription>
          </div>
          {loading ? null : (
            <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>{rows.length} brands · {totalClaims} claims</Badge>
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
            title="No brand has claims in this run yet."
            description="A brand appears here once at least one engine returns a claim for it. Ranking is by claim volume, then engine breadth."
          />
        </div>
      ) : (
        <div className="mt-3">
            <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-16 pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Rank</TableHead><TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Brand</TableHead><TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Claims</TableHead><TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Engines</TableHead><TableHead className="hidden pr-5 text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:table-cell">Leading hook</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((row) => <TableRow key={row.brandId}><TableCell className={cn(VALUE_CLASS, "pl-5 text-muted-foreground")}>{String(row.rank).padStart(2, "0")}</TableCell><TableCell className="max-w-[18rem] whitespace-normal font-medium text-foreground">{row.brandName}</TableCell><TableCell className={cn(VALUE_CLASS, "text-right text-foreground")}>{row.claimCount}</TableCell><TableCell className={cn(VALUE_CLASS, "text-right text-muted-foreground")}>{row.engineCount}</TableCell><TableCell className="hidden pr-5 text-right md:table-cell">{row.topHook ? <Badge variant="secondary" className="font-normal">{row.topHook} · {row.topHookCount}</Badge> : <span className="text-muted-foreground">Not tagged</span>}</TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
