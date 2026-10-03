
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK_DAYS = 7;

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shortDate(date: Date, withYear: boolean): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  })
    .format(date)
    .replace("Sept", "Sep"); // en-GB spells September "Sept"
}

export function formatRelative(iso: string | null | undefined, now: Date): string | null {
  const date = parse(iso);
  if (!date) return null;
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "yesterday";
  if (days < WEEK_DAYS) return `${days} days ago`;
  return shortDate(date, date.getFullYear() !== now.getFullYear());
}

function zoned(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
    ...(timeZone ? { timeZone } : {}),
  })
    .format(date)
    .replace(/(\d{4}) at /, "$1, ")
    .replace("Sept", "Sep");
}

export function formatExact(iso: string | null | undefined): { local: string; utc: string } | null {
  const date = parse(iso);
  if (!date) return null;
  return { local: zoned(date), utc: zoned(date, "UTC") };
}
