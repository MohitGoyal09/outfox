"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

import {
  Button,
  Chip,
  LABEL_CLASS,
  Panel,
  Trail,
  TrailSkeleton,
  VALUE_CLASS,
  iconProps,
  type Tone, SectionHeader } from "@/components/drishti";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { cn } from "@/lib/utils";
import { READOUT_SEPARATOR, engineCellTone } from "./labels";
import { BriefView } from "./BriefView";
import {
  buildTrailSteps,
  filterClaims,
  trailFilterOptions,
  trailGaps,
} from "./derive";
import type {
  BrandRef,
  BriefComposition,
  ClaimDoc,
  EngineGap,
} from "./types";

export const DEFAULT_VISIBLE_STEPS = 5;

export type TrailSurfaceProps = {
  composition: BriefComposition;
  claimText: Map<string, string>;
  briefLoading: boolean;
  claims: readonly ClaimDoc[];
  brands: readonly BrandRef[];
  gaps: readonly EngineGap[];
  loading: boolean;
  focusedStepId: string | null;
  onCite: (ids: string[]) => void;
  onStepFocus: (claimId: string) => void;
  engineFilter: string | null;
  brandFilter: string | null;
  onEngineFilter: (engine: string | null) => void;
  onBrandFilter: (brandId: string | null) => void;
  showAll: boolean;
  onShowAll: (showAll: boolean) => void;
  className?: string;
};

export function TrailSurface({
  composition,
  claimText,
  briefLoading,
  claims,
  brands,
  gaps,
  loading,
  focusedStepId,
  onCite,
  onStepFocus,
  engineFilter,
  brandFilter,
  onEngineFilter,
  onBrandFilter,
  showAll,
  onShowAll,
  className,
}: TrailSurfaceProps) {
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const brand of brands) map.set(brand.id, brand.name);
    return map;
  }, [brands]);

  const options = useMemo(
    () => trailFilterOptions(claims, brands),
    [claims, brands],
  );

  const gapToneByEngine = useMemo(() => {
    const map = new Map<string, Tone>();
    for (const gap of gaps) map.set(gap.engine, engineCellTone(gap.status));
    return map;
  }, [gaps]);

  const filtered = useMemo(
    () => filterClaims(claims, { engine: engineFilter, brandId: brandFilter }),
    [claims, engineFilter, brandFilter],
  );
  const steps = useMemo(
    () =>
      buildTrailSteps(
        showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE_STEPS),
        names,
      ),
    [filtered, showAll, names],
  );

  const activeGaps = useMemo(
    () => (engineFilter === null ? gaps : gaps.filter((gap) => gap.engine === engineFilter)),
    [gaps, engineFilter],
  );

  const hasFilter = engineFilter !== null || brandFilter !== null;
  const summary = [
    showAll || filtered.length <= DEFAULT_VISIBLE_STEPS
      ? `${filtered.length} ${filtered.length === 1 ? "step" : "steps"}`
      : `${DEFAULT_VISIBLE_STEPS} of ${filtered.length} steps`,
    hasFilter ? `${claims.length} in this run` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(` ${READOUT_SEPARATOR} `);

  return (
    <Panel
      interactive={false}
      className={cn("overflow-hidden", className)}
      ariaLabel="The brief and the trail"
    >
      <div className="border-b border-border px-5 py-4">
        <SectionHeader as="h3" title="The trail" />
      </div>
      <div className="p-5">
      <p className="type-body measure-prose mt-1.5 text-fg-secondary">
        The brief and the trail are one surface. Every sentence cites the claims
        it rests on, and picking a citation marks the step below that produced it.
      </p>

      <div className="mt-5 border-t border-border pt-4">
        <p className={cn(LABEL_CLASS, "text-fg-tertiary")}>brief</p>
        <BriefView
          className="mt-3"
          composition={composition}
          claimText={claimText}
          focusedStepId={focusedStepId}
          onCite={onCite}
          loading={briefLoading}
        />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className={cn(LABEL_CLASS, "text-fg-tertiary")}>trail</p>
          <p className={cn(VALUE_CLASS, "text-[12px] text-fg-secondary")}>
            {loading ? "counting steps" : summary}
          </p>
        </div>

        {loading ? null : (
          <>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                <span
                  className={cn(
                    LABEL_CLASS,
                    "w-12 shrink-0 text-fg-tertiary",
                  )}
                >
                  engine
                </span>
                {options.engines.map((option) => (
                  <Chip
                    key={option.value}
                    tone={gapToneByEngine.get(option.value) ?? "ok"}
                    pressed={engineFilter === option.value}
                    onClick={() =>
                      onEngineFilter(engineFilter === option.value ? null : option.value)
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      <PlatformLogo engine={option.value} className="size-3" />
                      <span>{`${option.label} ${option.count}`}</span>
                    </span>
                  </Chip>
                ))}
                {options.engines.length === 0 ? (
                  <span className="text-[12px] text-fg-tertiary">
                    No engines recorded claims for this run.
                  </span>
                ) : null}
              </div>

              {options.brands.length === 0 ? null : (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  <span
                    className={cn(
                      LABEL_CLASS,
                      "w-12 shrink-0 text-fg-tertiary",
                    )}
                  >
                    rival
                  </span>
                  {options.brands.map((option) => (
                    <Chip
                      key={option.value}
                      label={`${option.label} ${option.count}`}
                      pressed={brandFilter === option.value}
                      onClick={() =>
                        onBrandFilter(brandFilter === option.value ? null : option.value)
                      }
                    />
                  ))}
                </div>
              )}

              {hasFilter ? (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onEngineFilter(null);
                      onBrandFilter(null);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : null}
            </div>

            <Trail
              className="mt-4"
              steps={steps}
              density="vertical"
              focusedId={focusedStepId}
              onStepFocus={onStepFocus}
              gaps={trailGaps(activeGaps)}
            />

            {filtered.length > DEFAULT_VISIBLE_STEPS ? (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShowAll(!showAll)}
                  iconRight={
                    <ChevronDown
                      {...iconProps}
                      size={14}
                      aria-hidden="true"
                      className={cn(
                        "size-3.5 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out",
                        showAll && "rotate-180",
                      )}
                    />
                  }
                >
                  {showAll
                    ? `Show the first ${DEFAULT_VISIBLE_STEPS} steps`
                    : `Show all ${filtered.length} steps`}
                </Button>
              </div>
            ) : null}
          </>
        )}

        {loading ? <TrailSkeleton className="mt-4" density="vertical" /> : null}
      </div>
      </div>
    </Panel>
  );
}
