import { PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../EmptyState";
import { Skeleton } from "../Skeleton";
import { sourceName } from "../labels";
import { VALUE_CLASS, iconProps } from "../tokens";
import {
  DATA_ENGINES,
  coverageGaps,
  engineStatusLabel,
  type BrandCoverage,
} from "./board-model";

export function EngineCoverage({
  coverage,
  loading = false,
  className,
}: {
  coverage: BrandCoverage[];
  loading?: boolean;
  className?: string;
}) {
  const gaps = coverageGaps(coverage);
  const checks = coverage.reduce((total, brand) => total + brand.cells.length, 0);

  return (
    <Card className={cn("border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">What we checked</CardTitle>
            <CardDescription className="mt-1">Which sources returned data for each rival. A gap is named, never counted as zero.</CardDescription>
          </div>
        {loading ? null : (
          <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>
            {checks - gaps.length}/{checks} source checks returned
          </Badge>
        )}
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">

      {loading ? (
        <div className="mt-3 flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <Skeleton variant="text" width={index % 2 === 0 ? "28%" : "22%"} />
              <Skeleton variant="text" width={index % 2 === 0 ? "68%" : "56%"} />
            </div>
          ))}
        </div>
      ) : coverage.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            icon={<PlugZap {...iconProps} size={16} />}
            title="No sources checked yet."
            description="Each source is checked once per rival. This appears once at least one source has returned something."
          />
        </div>
      ) : (
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Brand</TableHead>{DATA_ENGINES.map((engine) => <TableHead key={engine} className="text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{sourceName(engine)}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{coverage.map((brand) => <TableRow key={brand.brandId}><TableCell className="whitespace-normal pl-5 font-medium text-foreground">{brand.brandName}</TableCell>{brand.cells.map((cell) => <TableCell key={cell.engine} className="text-right"><Badge variant="outline" title={cell.reason ?? undefined} className={cn("font-normal", cell.status === "ok" ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700" : cell.status === "absent" ? "text-muted-foreground" : "border-amber-600/30 bg-amber-500/10 text-amber-700")}>{engineStatusLabel(cell.status)}</Badge></TableCell>)}</TableRow>)}</TableBody>
        </Table>
      )}

      {gaps.length > 0 ? (
        <p className="mt-3 text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
          {gaps.length === 1
            ? "1 source check did not return. It is named above."
            : `${gaps.length} source checks did not return. Each is named above.`}
        </p>
      ) : null}
      </CardContent>
    </Card>
  );
}
