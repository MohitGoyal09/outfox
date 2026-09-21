import { PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { Skeleton } from "../Skeleton";
import { VALUE_CLASS, iconProps, type Tone } from "../tokens";
import { coverageGaps, type BrandCoverage, type EngineStatus } from "./board-model";

const STATUS_TONE: Record<EngineStatus, Tone> = {
  ok: "ok",
  failed: "danger",
  unavailable: "weak",
  absent: "neutral",
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
    <Panel
      as="section"
      interactive={false}
      className={cn("p-4", className)}
      ariaLabel="Engine coverage"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
          Engine coverage
        </h2>
        {loading ? null : (
          <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary,#64646f)]")}>
            {checks - gaps.length}/{checks} engine checks returned
          </span>
        )}
      </div>
      <p className="mt-1 max-w-[68ch] text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
        Which engines returned data for which rival. A gap is named with its
        reason and is never counted as a zero.
      </p>

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
            title="No engines ran in this run."
            description="Each engine records a snapshot per rival when it returns. Coverage appears here once a run has fetched at least one engine."
          />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {coverage.map((brand) => (
            <li key={brand.brandId} className="flex flex-col gap-1.5">
              <span className="break-words text-[13px] leading-[1.4] text-[var(--text-primary,#eeeef2)]">
                {brand.brandName}
              </span>
              <ul className="flex flex-wrap items-center gap-1.5">
                {brand.cells.map((cell) => (
                  <li key={cell.engine}>
                    <Chip
                      label={`${cell.label} ${cell.status}`}
                      tone={STATUS_TONE[cell.status]}
                      title={cell.reason ?? undefined}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {gaps.length > 0 ? (
        <p className="mt-3 text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
          {gaps.length === 1
            ? "1 engine check did not return. It is named above."
            : `${gaps.length} engine checks did not return. Each is named above.`}
        </p>
      ) : null}
    </Panel>
  );
}
