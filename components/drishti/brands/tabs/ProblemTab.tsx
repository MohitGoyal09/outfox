"use client";

import { useMemo } from "react";
import { AlertTriangle, HelpCircle, Search } from "lucide-react";
import { EmptyState } from "../../EmptyState";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { stageName } from "@/components/drishti/labels";
import {
  funnelCoverageGaps,
  funnelDistribution,
  isContentClaim,
  relatedQuestionClaims,
  relatedSearchClaims,
  tagBearingClaims,
  tagsForClaim,
  type BrandDoc,
  type ClaimDoc,
  type SnapshotDoc,
} from "../brand-model";
import { EvidenceGrid } from "../EvidenceGrid";
import { FunnelPanel } from "../EvidencePanels";
import { evidencePageLabel, matchesBrandFilters, type BrandFilters } from "../filters/filters-model";
import { displayClaimText } from "../format";
import { TrendsExperience } from "../TrendsExperience";

function resolveTaggedContentClaims(claims: ClaimDoc[], tagRows: ClaimDoc[]): ClaimDoc[] {
  const byId = new Map(claims.map((claim) => [String(claim._id), claim]));
  const resolved = new Map<string, ClaimDoc>();
  for (const tag of tagRows) {
    const target = tag.taggedClaimId !== undefined ? byId.get(String(tag.taggedClaimId)) : tag;
    if (target !== undefined && isContentClaim(target)) resolved.set(String(target._id), target);
  }
  return [...resolved.values()];
}

function RelatedListPanel({
  title,
  icon,
  claims,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  icon: React.ReactNode;
  claims: ClaimDoc[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        {icon}
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">{title}</h3>
      </div>
      <div className="p-4">
        {claims.length === 0 ? (
          <EmptyState size="sm" icon={icon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul className="space-y-2 text-sm">
            {claims.map((claim) => (
              <li key={String(claim._id)}>
                <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" className="text-fg hover:underline">
                  {displayClaimText(claim.text)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function FunnelCoveragePanel({ items }: { items: ReturnType<typeof funnelDistribution> }) {
  const gaps = useMemo(() => funnelCoverageGaps(items), [items]);
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <AlertTriangle className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Funnel-coverage gaps"
            definition="Which audience stages have no tagged evidence in this check. A stage with no tag is a coverage gap, not a measured fall to zero; shares are of tagged findings only."
          />
        </h3>
      </div>
      <div className="space-y-3 p-4">
        <FunnelPanel items={items} />
        {gaps.length > 0 ? (
          <p className="rounded-sm border border-dashed border-border bg-bg-inset/40 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
            No tagged evidence yet for: <span className="font-medium text-fg">{gaps.map((stage) => stageName(stage)).join(", ")}</span>.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

export function ProblemTab({
  brand,
  latestClaims,
  claims,
  tags,
  trendsSnapshot,
  latestRunAt,
  filters,
  now,
}: {
  brand: BrandDoc;
  latestClaims: ClaimDoc[];
  claims: ClaimDoc[];
  tags: ClaimDoc[];
  trendsSnapshot?: SnapshotDoc;
  latestRunAt?: string | null;
  filters: BrandFilters;
  now: number;
}) {
  const filtered = useMemo(
    () => latestClaims.filter((claim) => matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, now)),
    [latestClaims, tags, filters, now],
  );
  const filteredTags = useMemo(() => tagBearingClaims(filtered), [filtered]);
  const funnelItems = useMemo(() => funnelDistribution(filteredTags), [filteredTags]);
  const problemEvidenceClaims = useMemo(() => resolveTaggedContentClaims(filtered, filteredTags), [filtered, filteredTags]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <RelatedListPanel
          title="Related questions"
          icon={<HelpCircle className="size-4 text-accent" />}
          claims={relatedQuestionClaims(filtered)}
          emptyTitle="No related questions yet."
          emptyDescription={'Google\'s "People also ask" questions for this brand fill this in once that metric ships.'}
        />
        <RelatedListPanel
          title="Related searches"
          icon={<Search className="size-4 text-accent" />}
          claims={relatedSearchClaims(filtered)}
          emptyTitle="No related searches yet."
          emptyDescription="Google's related-search suggestions for this brand fill this in once that metric ships."
        />
      </div>
      <TrendsExperience snapshot={trendsSnapshot} claims={claims} brandId={brand._id} brandName={brand.name} latestRunAt={latestRunAt} />
      <FunnelCoveragePanel items={funnelItems} />
      <div>
        <h2 className="type-headline text-fg">Real problem evidence</h2>
        <EvidenceGrid
          claims={problemEvidenceClaims}
          sort={filters.sort}
          emptyMessage="No tagged problem evidence yet. Real findings with a hook/funnel tag will fill this in once a tagged check completes."
          pageLabel={evidencePageLabel("Problem tab", filters)}
        />
      </div>
    </div>
  );
}
