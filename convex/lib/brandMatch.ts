
export type BrandMatch = {
  brandId: string;
  brandName: string;
  score: number;
  matchedOn: "name" | "alias" | "own";
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

const FIRST_PERSON_PRONOUNS = ["we", "us", "our", "i"] as const;

const COMPARISON_SIGNALS = [
  "compare",
  "compared",
  "comparing",
  "comparison",
  " vs ",
  " vs.",
  "versus",
  "against",
  "beat ",
  "beats",
  "beating",
  "outperform",
  "outperforms",
  "outperforming",
  "ahead of",
  "behind",
  "better than",
  "worse than",
  "the only one",
  "stack up",
  "stacks up",
  "stacking up",
  " rank",
  "ranking",
];

function hasFirstPersonPronoun(text: string): boolean {
  return FIRST_PERSON_PRONOUNS.some((pronoun) => containsToken(text, pronoun));
}

function hasComparisonSignal(text: string): boolean {
  const padded = ` ${text} `;
}
