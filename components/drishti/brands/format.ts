import { formatStamp } from "../cohorts/cohorts-model";
import { nameEnumsInText } from "../labels";

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

export function displayClaimText(text: string): string {
  const match = text.match(/^(?:Organic|News) result "([\s\S]*?)"([\s\S]*)$/);
  const body = match ? `${match[1]}${match[2]}` : text;
  const named = nameEnumsInText(decodeClaimEntities(body.replace(/\s+in trends-chunk-\d+/g, "").replace(/\s*trends-chunk-\d+/g, "")));
  return named.replace(/\b(\d{5,})(?= total results)/g, (digits) => compactCount(Number(digits)));
}

export function parseRelatedVideoViews(text: string): number | null {
  if (match === null) return null;
  const value = Number(match[1]);
}

export function parseShoppingPrice(text: string): string | null {
  const match = text.match(/ at ([^"]+)$/);
  return match ? decodeClaimEntities(match[1]) : null;
}

export function isGarbledDescriptionLinkAnchor(anchor: string): boolean {
  return /[\n\r ]/.test(anchor);
}

export function parseListingVendor(text: string): string | null {
  const withoutMatchSuffix = text.split(' (matched to "')[0];
  const withoutPrice = withoutRating.split(" at ")[0];
  const match = withoutPrice.match(/ listed by ([\s\S]+)$/);
  return match ? decodeClaimEntities(match[1].trim()) : null;
}
