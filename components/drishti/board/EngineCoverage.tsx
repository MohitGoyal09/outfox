import { PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { sourceName } from "../labels";
import { LABEL_CLASS, VALUE_CLASS, iconProps, sourceColor } from "../tokens";
import {
  DATA_ENGINES,
  coverageGaps,
  engineStatusLabel,
  type BrandCoverage,
  type EngineStatus,
} from "./board-model";

const STATUS_BADGE_CLASS: Record<EngineStatus, string> = {
  ok: "border-ok/30 bg-ok/10 text-ok",
  failed: "border-danger/30 bg-danger/10 text-danger",
  unavailable: "border-warn/30 bg-warn/10 text-warn",
  absent: "text-fg-tertiary",
};

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
    <Panel interactive={false} className={cn("flex flex-col", className)} ariaLabel="What we checked">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h3 className="type-headline text-fg">What we checked</h3>
          <p className="mt-1 type-caption text-fg-secondary">
            Which sources returned data for each rival. A gap is named, never counted as zero.
          </p>
        </div>
        {loading ? null : (
          <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>
            {checks - gaps.length}/{checks} source checks returned
          </Badge>
        )}
      </header>

      {loading ? (
        <SkeletonRegion label="Loading what we checked" className="flex flex-col gap-3 p-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <Skeleton variant="text" width={index % 2 === 0 ? "28%" : "22%"} />
              <Skeleton variant="text" width={index % 2 === 0 ? "68%" : "56%"} />
            </div>
          ))}
        </SkeletonRegion>
      ) : coverage.length === 0 ? (
        <div className="p-4">
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
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(LABEL_CLASS, "pl-5 text-fg-tertiary")}>Brand</TableHead>
              {DATA_ENGINES.map((engine) => (
                <TableHead key={engine} className={cn(LABEL_CLASS, "text-right text-fg-tertiary")}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: sourceColor(engine) }}
                    />
                    {sourceName(engine)}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {coverage.map((brand) => (
              <TableRow key={brand.brandId} className={cn(brand.isOwnBrand && "bg-bg-inset hover:bg-bg-inset")}>
                <TableCell className={cn("whitespace-normal pl-5 text-fg", brand.isOwnBrand ? "font-semibold" : "font-medium")}>
                  {brand.isOwnBrand ? (
                    <>
                      <Badge variant="outline" className="mr-2 font-normal">You</Badge>
                      {brand.brandName}
                    </>
                  ) : (
                    brand.brandName
                  )}
                </TableCell>
                {brand.cells.map((cell) => (
                  <TableCell key={cell.engine} className="text-right">
                    <Badge
                      variant="outline"
                      title={cell.reason ?? undefined}
                      className={cn("font-normal", STATUS_BADGE_CLASS[cell.status])}
                    >
                      {engineStatusLabel(cell.status)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {gaps.length > 0 ? (
        <p className="border-t border-border px-5 py-3 text-[12.5px] leading-[1.5] text-fg-secondary">
          {gaps.length === 1
            ? "1 source check did not return. It is named above."
            : `${gaps.length} source checks did not return. Each is named above.`}
        </p>
      ) : null}
    </Panel>
  );
}