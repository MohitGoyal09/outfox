"use client";

import { useMemo } from "react";
import { Panel } from "../../Panel";
import {
  relatedQuestionClaims,
  relatedSearchClaims,
  tagsForClaim,
  type BrandDoc,
  type ClaimDoc,
  type SnapshotDoc,
} from "../brand-model";
import { matchesBrandFilters, type BrandFilters } from "../filters/filters-model";
import { displayClaimText } from "../format";
import { NotFoundInCheck } from "../NotFoundInCheck";
import { TrendsExperience } from "../TrendsExperience";

function RelatedListPanel({ title, claims }: { title: string; claims: ClaimDoc[] }) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <Panel.Header title={title} />
      <ul className="space-y-2 p-4 text-sm">
        {claims.map((claim) => (
          <li key={String(claim._id)}>
            <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" className="text-fg hover:underline">
              {displayClaimText(claim.text)}
            </a>
          </li>
        ))}
      </ul>
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
  const lists = [
    { title: "Related questions", claims: relatedQuestionClaims(filtered) },
    { title: "Related searches", claims: relatedSearchClaims(filtered) },
  ];
  const found = lists.filter((list) => list.claims.length > 0);
  const missing = lists.filter((list) => list.claims.length === 0).map((list) => list.title);
  return (
    <div className="space-y-4">
      {found.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {found.map((list) => (
            <RelatedListPanel key={list.title} title={list.title} claims={list.claims} />
          ))}
        </div>
      ) : null}
      <NotFoundInCheck items={missing} />
      <TrendsExperience snapshot={trendsSnapshot} claims={claims} brandId={brand._id} brandName={brand.name} latestRunAt={latestRunAt} />
    </div>
  );
}
