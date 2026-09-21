"use client";

import { ArrowRight, CircleAlert, Plus } from "lucide-react";

import {
  Chip,
  EmptyState,
  LABEL_CLASS,
  Panel,
  Skeleton,
  SkeletonRegion,
  VALUE_CLASS,
  iconProps,
} from "@/components/drishti";
import { cn } from "@/lib/utils";

import { ActionLink } from "./ActionLink";
import { SectionLabel } from "./SectionLabel";
import {
  evidenceRow,
  formatRunDate,
  runHref,
  type CohortCounts,
  type Digest,
} from "./digest";

export type SinceLastRunProps = {
  brandsLoading: boolean;
  cohortKey: string;
  runLoading: boolean;
  runExists: boolean;
  runRequestedAt: string | null;
  claimsLoading: boolean;
  claimsEmpty: boolean;
  digest: Digest | null;
  counts: CohortCounts | null;
};

function DigestSkeleton() {
  return (
    <SkeletonRegion label="Loading the latest run">
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" height={18} width="44%" />
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="text" width="32%" />
        <Skeleton variant="text" width="76%" />
      </div>
    </SkeletonRegion>
  );
}

export function SinceLastRun({
  brandsLoading,
  cohortKey,
  runLoading,
  runExists,
  runRequestedAt,
  claimsLoading,
  claimsEmpty,
  digest,
  counts,
}: SinceLastRunProps) {
  const stale = !runExists || !runRequestedAt;

  return (
    <Panel as="section" interactive={false} padded ariaLabel="Since your last run">
      <SectionLabel
        trailing={
          stale ? null : (
            <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
              {formatRunDate(runRequestedAt)}
            </span>
          )
        }
      >
        Since your last run
      </SectionLabel>

      <div className="mt-4">
        {brandsLoading || (cohortKey !== "" && runLoading) ? (
          <DigestSkeleton />
        ) : cohortKey === "" ? (
          <EmptyState
            size="sm"
            bounded
            icon={<Plus {...iconProps} size={16} aria-hidden="true" />}
            title="No rivals are in this cohort yet"
            description="Add brands to a cohort, then run a comparison. The strongest change from that run appears here with the claim count, the engines that answered, and the source lines behind it."
            action={
              <ActionLink href="/cohorts" variant="primary" size="sm">
                Add rivals
              </ActionLink>
            }
          />
        ) : !runExists ? (
          <EmptyState
            size="sm"
            bounded
            icon={<CircleAlert {...iconProps} size={16} aria-hidden="true" />}
            title="No run for this cohort yet"
            description="A run compares every rival at one moment. Once one finishes, this panel states in words what it found, with the claim count, the engines that answered, and the source lines behind it."
            action={
              <ActionLink href={runHref(cohortKey)} variant="primary" size="sm">
                Open the run view
              </ActionLink>
            }
          />
        ) : claimsLoading ? (
          <DigestSkeleton />
        ) : claimsEmpty || digest === null || counts === null ? (
          <EmptyState
            size="sm"
            bounded
            title="No claims in this run yet"
            description="Engines return claims as they answer. When the first claim arrives, this digest names what the run found and links to its evidence."
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="type-title max-w-[46ch] text-balance text-fg">
              {digest.headline}
            </p>
            <p className="type-body max-w-[68ch] text-fg-secondary">
              {digest.body}
            </p>
            <p className={cn(VALUE_CLASS, "text-[12px] text-fg-secondary")}>
              {evidenceRow(counts)}
            </p>

            {digest.mode === "template" ? (
              <p className="flex flex-wrap items-center gap-2">
                <Chip label="template brief" tone="warn" />
                <span className="type-caption text-fg-secondary">
                  Raw stored claims, not a model-written narrative.
                </span>
              </p>
            ) : null}

            {digest.sources.length > 0 ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>
                  Seen across
                </span>
                <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {digest.sources.map((source) => (
                    <li
                      key={`${source.brandName}:${source.text}`}
                      className="type-caption max-w-[52ch] text-fg-secondary [overflow-wrap:anywhere]"
                    >
                      <span className="text-fg">“{source.text}”</span>{" "}
                      <span className="text-fg-tertiary">
                        — {source.brandName}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="pt-1">
              <ActionLink
                href={runHref(cohortKey)}
                icon={
                  <ArrowRight
                    {...iconProps}
                    size={16}
                    aria-hidden="true"
                    className="size-4"
                  />
                }
              >
                View evidence
              </ActionLink>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
