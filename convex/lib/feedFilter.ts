

export function sameSource(a: string, b: string): boolean {
  return sourceKey(a) === sourceKey(b);
}

export type FeedRow = {
  _id: unknown;
  sourceEngine: string;
  fetchedAt: string;
  taggedClaimId?: unknown;
  hookType?: string;
  funnelStage?: string;
};

export type FeedRowFilter = {
  engine?: string;
  fromIso?: string;
  toIso?: string;
  hook?: string;
  funnel?: string;
};

export function selectFeedRows<T extends FeedRow>(stored: readonly T[], filter: FeedRowFilter, limit: number) {
  const matching = rows.filter((row) => {
    if (filter.engine !== undefined && !sameSource(row.sourceEngine, filter.engine)) return false;
    if (filter.hook !== undefined && !tags.some((tag) => tag.hookType === filter.hook)) return false;
    if (filter.funnel !== undefined && !tags.some((tag) => tag.funnelStage === filter.funnel)) return false;
    return true;
  });
  const recent = [...matching].sort(newestFirst).slice(0, limit);
  const isFiltered = Object.values(filter).some((value) => value !== undefined);
  const tags = isFiltered
    ? allTags.filter((tag) => tag.taggedClaimId !== undefined && recentIds.has(String(tag.taggedClaimId))).sort(newestFirst)
    : [...allTags].sort(newestFirst).slice(0, limit);
}
