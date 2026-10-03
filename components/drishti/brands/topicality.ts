
export type TopicalityClaim = { text: string; evidenceUrl: string; sourceEngine: string };
export type TopicalityBrand = { name: string; domain: string; aliases?: readonly string[]; vertical: string };
export type Topicality = "on_topic" | "possibly_off_topic";

const BRAND_SCOPED_ENGINES: readonly string[] = ["google_trends", "google_ads_transparency_center"];

const BEAUTY_TERMS: readonly string[] = [
  "skin", "skincare", "serum", "sunscreen", "spf", "moisturiser", "moisturizer", "cream", "face", "facewash",
  "cleanser", "toner", "hair", "shampoo", "lip", "makeup", "cosmetic", "cosmetics", "beauty", "vegan",
  "niacinamide", "retinol", "vitamin c", "acne", "glow",
];

const BEAUTY_VERTICAL = /skin|beauty|cosmetic|personal care/;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function words(value: string): string {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function hasWord(paddedWords: string, term: string): boolean {
  return paddedWords.includes(` ${term} `) || paddedWords.includes(` ${term}s `);
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function contextTermsFor(vertical: string): readonly string[] {
  return BEAUTY_VERTICAL.test(normalize(vertical)) ? [...BEAUTY_TERMS, ...BUSINESS_TERMS] : BUSINESS_TERMS;
}
