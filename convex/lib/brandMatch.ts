
export type BrandMatch = {
  brandId: string;
  brandName: string;
  score: number;
  matchedOn: "name" | "alias";
};

export function matchBrandQuery(
  query: string,
  brands: ReadonlyArray<{ _id: unknown; name: string; aliases: readonly string[] }>,
): BrandMatch[] {
  if (q === "") return [];
  return matches.sort((a, b) => b.score - a.score);
}

export const MAX_MENTIONED_BRANDS = 3;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
