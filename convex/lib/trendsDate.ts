
const SINGLE_RE = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/;
const RANGE_RE = /^([A-Za-z]{3})\s+\d{1,2}\s*-\s*(?:([A-Za-z]{3})\s+)?(\d{1,2}),\s*(\d{4})$/;

function monthNumber(name: string): number | null {
  return MONTHS[name] ?? null;
}

export function compareTrendsDates(a: string, b: string): number {
  const isoA = trendsDateToIso(a);
  const isoB = trendsDateToIso(b);
}
