
const TRENDS_MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
const TRENDS_ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TRENDS_SINGLE_RE = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/;
const TRENDS_RANGE_RE = /^([A-Za-z]{3})\s+\d{1,2}\s*-\s*(?:([A-Za-z]{3})\s+)?(\d{1,2}),\s*(\d{4})$/;

export function trendsDateToIso(raw: string): string | null {
  const value = raw.trim();
  if (value === "") return null;
  const iso = TRENDS_ISO_RE.exec(value);
  if (iso !== null) {
    const [, , month, day] = iso;
    if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) return null;
    return value;
  }
  const range = TRENDS_RANGE_RE.exec(value);
  if (range !== null) {
    const [, startMonth, endMonth, day, year] = range;
    const month = TRENDS_MONTHS[endMonth ?? startMonth];
    if (month === undefined) return null;
    return `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const single = TRENDS_SINGLE_RE.exec(value);
  if (single !== null) {
    const [, monthName, day, year] = single;
    const month = TRENDS_MONTHS[monthName];
    if (month === undefined) return null;
    return `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

export function compareTrendsDates(a: string, b: string): number {
  const isoA = trendsDateToIso(a);
  const isoB = trendsDateToIso(b);
  if (isoA !== null && isoB !== null) {
    return isoA < isoB ? -1 : isoA > isoB ? 1 : 0;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

export type TrendsChunkRow = {
  id: string;
  brandId: string;
  chunkKey: string;
  date: string;
  value?: string | number;
  period?: string;
  evidenceUrl: string;
  fetchedAt: string;
  granularity: "point" | "window";
};

export type ChunkGroup = {
  chunkKey: string;
  rows: TrendsChunkRow[];
};

export function canConnectWithLine(rows: readonly TrendsChunkRow[]): boolean {
  return rows.every((row) => row.granularity === "point");
}

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
    rows: [...(byChunk.get(chunkKey) ?? [])].sort((a, b) =>
      compareTrendsDates(a.date ?? a.fetchedAt, b.date ?? b.fetchedAt),
    ),
  }));
}
