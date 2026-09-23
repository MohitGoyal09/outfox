"use client";

import { useMemo } from "react";
import { AlertTriangle, HelpCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../../EmptyState";
import { iconProps } from "../../tokens";
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
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        {icon}
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {claims.length === 0 ? (
          <EmptyState size="sm" icon={icon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul className="space-y-2 text-sm">
            {claims.map((claim) => (
              <li key={String(claim._id)}>
                <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" className="text-foreground hover:text-accent hover:underline">
                  {displayClaimText(claim.text)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelCoveragePanel({ items }: { items: ReturnType<typeof funnelDistribution> }) {
  const gaps = useMemo(() => funnelCoverageGaps(items), [items]);
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <AlertTriangle className="size-4 text-accent" />
        <CardTitle className="text-sm">Funnel-coverage gaps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <FunnelPanel items={items} />
        {gaps.length > 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
            No tagged evidence yet for: <span className="font-medium text-foreground">{gaps.map((stage) => stage.replaceAll("_", " ")).join(", ")}</span>.
          </p>
        ) : null}
      </CardContent>
    </Card>
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
          emptyTitle="No related questions stored yet."
          emptyDescription={'Google\'s "People also ask" questions for this brand fill this in once that metric ships.'}
        />
        <RelatedListPanel
          title="Related searches"
          icon={<Search className="size-4 text-accent" />}
          claims={relatedSearchClaims(filtered)}
          emptyTitle="No related searches stored yet."
          emptyDescription="Google's related-search suggestions for this brand fill this in once that metric ships."
        />
      </div>
      <TrendsExperience snapshot={trendsSnapshot} claims={claims} brandId={brand._id} brandName={brand.name} latestRunAt={latestRunAt} />
      <FunnelCoveragePanel items={funnelItems} />
      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-[-0.02em]">Real problem evidence</h2>
        <EvidenceGrid
          claims={problemEvidenceClaims}
          sort={filters.sort}
          emptyMessage="No tagged problem evidence stored yet. Real claims with a hook/funnel tag will fill this in once a tagged run completes."
          pageLabel={evidencePageLabel("Problem tab", filters)}
        />
      </div>
    </div>
  );
}
