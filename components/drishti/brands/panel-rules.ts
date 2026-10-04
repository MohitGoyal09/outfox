

const ADDRESSES_READER =
  /^(?:if you(?:'d| would)? (?:want|like|need|prefer)|i can\b|i['’]ll\b|i['’]d be\b|let me\b|let['’]s\b|tell me\b|feel free\b|would you like\b|do you want\b|want me to\b|just let me know\b|let me know\b|please let me know\b|happy to help\b)/i;


export function labelKey(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[\s.!?,;:…]+$/u, "");
}

export function groupLabelRows(rows: readonly { label: string; count: number }[]): { label: string; count: number }[] {
  for (const row of rows) {
    const key = labelKey(row.label);
    if (key === "") continue;
    const group = groups.get(key) ?? { count: 0, spellings: new Map<string, number>() };
    group.spellings.set(spelling, (group.spellings.get(spelling) ?? 0) + row.count);
  }
  return [...groups.values()]
    .map((group) => {
      return { label, count: group.count };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}


function parseHttpUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) ? parsed : null;
  } catch {
    return null;
  }
}

function isYoutubeHost(host: string): boolean {
  return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
}

export function isYoutubeVideoUrl(url: string): boolean {
  const parsed = parseHttpUrl(url);
  if (parsed === null) return false;
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return true;
  if (!isYoutubeHost(host)) return false;
}

const STORE_WORDS = new Set(["official", "store", "shop", "online", "india", "website", "site", "the", "www", "com", "co", "in"]);

export function splitOwnStore(
  rows: readonly { label: string; count: number }[],
  brand: { name: string; domain: string },
): { retailers: { label: string; count: number }[]; ownStoreCount: number } {
  const retailers: { label: string; count: number }[] = [];
  return { retailers, ownStoreCount };
}
