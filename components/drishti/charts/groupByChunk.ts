
export type TrendsChunkRow = {
  id: string;
  brandId: string;
  chunkKey: string;
  date: string;
  value?: string | number;
  period?: string;
  evidenceUrl: string;
  fetchedAt: string;
};

export type ChunkGroup = {
  chunkKey: string;
  rows: TrendsChunkRow[];
};

export const UNKNOWN_CHUNK_KEY = "unknown-chunk";

export function groupByChunk(
  rows: readonly TrendsChunkRow[],
): ChunkGroup[] {
  const order: string[] = [];
  const byChunk = new Map<string, TrendsChunkRow[]>();

  for (const row of rows) {
    const chunkKey =
      typeof row.chunkKey === "string" && row.chunkKey.trim() !== ""
        ? row.chunkKey
        : UNKNOWN_CHUNK_KEY;
    const existing = byChunk.get(chunkKey);
    if (existing) {
      existing.push(row);
    } else {
      byChunk.set(chunkKey, [row]);
      order.push(chunkKey);
    }
  }

  return order.map((chunkKey) => ({
    chunkKey,
    rows: [...(byChunk.get(chunkKey) ?? [])].sort((a, b) => {
      const dateA = a.date ?? a.fetchedAt;
      const dateB = b.date ?? b.fetchedAt;
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    }),
  }));
}
