
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


export function normalizeBrandDomain(input: string): string {
  const raw = input.trim().toLowerCase();
  if (raw === "" || /\s|@/.test(raw)) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;
  return (hostnameOf(withScheme) ?? "").replace(/\.$/, "");
}

export function resultsShowDomain(data: unknown, domain: string): boolean {
  const target = normalizeBrandDomain(domain);
  if (!isPlausibleBrandDomain(target)) return false;
  const onTarget = (link: unknown): boolean => {
  };
  const root = data as { organic_results?: unknown; knowledge_graph?: { website?: unknown } } | null;
  const results = root?.organic_results;
  if (!Array.isArray(results)) return false;
  return results.some((item) => onTarget((item as { link?: unknown } | null)?.link));
}

const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
