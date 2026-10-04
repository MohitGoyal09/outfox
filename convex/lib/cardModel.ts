
export type ThumbInput = { sourceEngine: string; evidenceUrl: string; sourceQuery: string; image?: string };

const httpUrl = (s: string | undefined): s is string => typeof s === "string" && /^https?:\/\/\S+$/i.test(s);

export function pickThumbnail(claim: ThumbInput): string | null {
  return null;
}
