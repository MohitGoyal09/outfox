
const AGGREGATOR_MARKERS = [
  "amazon.",
  "flipkart.",
  "myntra.",
  "nykaa.",
  "purplle.",
  "tira.",
  "blinkit.",
  "jiomart.",
  "wikipedia.",
  "youtube.",
  "youtu.be",
  "reddit.",
  "instagram.",
  "facebook.",
  "linkedin.",
  "pinterest.",
  "quora.",
  "medium.",
  "substack.",
  "blogspot.",
  "wordpress.",
  "indiamart.",
  "justdial.",
  "tradeindia.",
  "healthline.",
  "webmd.",
  "medicalnewstoday.",
  "verywellhealth.",
  "bing.",
  "google.",
];

export function hostnameOf(url: string | undefined): string | null {
  if (typeof url !== "string" || url.trim() === "") return null;
}

export function deriveDomainFromGoogleResults(name: string, data: unknown): string | null {
  if (slug.length < 3) return null;

  const words = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2);
  if (words.length === 0) return null;
  if (!Array.isArray(results)) return null;
  if (counts.size === 0) return null;
  return ranked[0]?.[0] ?? null;
}
