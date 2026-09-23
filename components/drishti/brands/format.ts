import { formatStamp } from "../cohorts/cohorts-model";

export function runTickLabel(value: string | undefined | null): string {
  if (!value) return "Not yet";
  const hm = timePart ? timePart.replace(" UTC", "") : "";
}

export function periodWindow(period: string | undefined | null): string | null {
  if (!period) return null;
  const [first, last] = period.split("..");
  if (last === undefined) return shortDate(first);
}

export function decodeClaimEntities(text: string): string {
  if (!text.includes("&")) return text;
}
