
export const CHECK_DATE = "4 Oct 2026";

export const HOOK_MATRIX = [
  { name: "SUGAR Cosmetics", total: 40, counts: { discount_offer: 1, social_proof: 3, founder_story: 2, problem_solution: 2, product_feature: 12, urgency_scarcity: 0, education_explainer: 16, visual_cold_open: 4 } },
  { name: "Plum", total: 31, counts: { discount_offer: 4, social_proof: 6, founder_story: 6, problem_solution: 0, product_feature: 3, urgency_scarcity: 1, education_explainer: 2, visual_cold_open: 9 } },
  { name: "Minimalist", total: 27, counts: { discount_offer: 1, social_proof: 7, founder_story: 3, problem_solution: 6, product_feature: 3, urgency_scarcity: 0, education_explainer: 6, visual_cold_open: 1 } },
  { name: "Mamaearth", total: 24, counts: { discount_offer: 4, social_proof: 3, founder_story: 0, problem_solution: 2, product_feature: 6, urgency_scarcity: 0, education_explainer: 7, visual_cold_open: 2 } },
  { name: "WOW Skin Science", total: 15, counts: { discount_offer: 0, social_proof: 2, founder_story: 3, problem_solution: 0, product_feature: 4, urgency_scarcity: 0, education_explainer: 4, visual_cold_open: 2 } },
] as const;

export type Evidence = {
  engine: "youtube_video" | "google_news" | "google" | "google_ads_transparency_center";
  title: string;
  where: string;
  url: string;
  fetched: string;
  videoId?: string;
  ad?: { format: "video" | "image"; days: number };
};

export type HeroFinding = {
  brand: string;
  hook: string;
  brandShare: number;
  brandCount: number;
  brandTotal: number;
  othersShare: number;
  othersCount: number;
  othersTotal: number;
  othersBrands: number;
  evidence: readonly Evidence[];
};

export const HERO_FINDINGS: readonly HeroFinding[] = [
  {
    brand: "SUGAR Cosmetics",
    hook: "Explainer",
    brandShare: 40,
    brandCount: 16,
    brandTotal: 40,
    othersShare: 20,
    othersCount: 19,
    othersTotal: 97,
    othersBrands: 4,
    evidence: [
      { engine: "youtube_video", title: "Makeup Tutorial in 5 Minutes | Easy Indian Makeup Look | SUGAR Cosmetics", where: "youtube.com", url: "https://www.youtube.com/watch?v=KoGsqgErT0c", fetched: CHECK_DATE, videoId: "KoGsqgErT0c" },
      { engine: "youtube_video", title: "Makeup Tutorial For Dry Skin VS Oily Skin | SUGAR Cosmetics", where: "youtube.com", url: "https://www.youtube.com/watch?v=xNQXM0IMLQY", fetched: CHECK_DATE, videoId: "xNQXM0IMLQY" },
      { engine: "google_news", title: "SUGAR Cosmetics Launches ‘Sugarquoted’, India’s First Beauty Education Podcast", where: "infashionbusiness.com", url: "https://infashionbusiness.com/home/news_details/7156/14", fetched: CHECK_DATE },
    ],
  },
  {
    brand: "Plum",
    hook: "Visual hook",
    brandShare: 29,
    brandCount: 9,
    brandTotal: 31,
    othersShare: 8,
    othersCount: 9,
    othersTotal: 106,
    othersBrands: 4,
    evidence: [
      { engine: "google_ads_transparency_center", title: "Video ad creative", where: "adstransparency.google.com", url: "https://adstransparency.google.com/advertiser/AR01253600073510551553/creative/CR16452517924121346049?region=IN", fetched: CHECK_DATE, ad: { format: "video", days: 141 } },
      { engine: "google_ads_transparency_center", title: "Image ad creative", where: "adstransparency.google.com", url: "https://adstransparency.google.com/advertiser/AR01253600073510551553/creative/CR12836030047844302849?region=IN", fetched: CHECK_DATE, ad: { format: "image", days: 109 } },
      { engine: "google_ads_transparency_center", title: "Image ad creative", where: "adstransparency.google.com", url: "https://adstransparency.google.com/advertiser/AR01253600073510551553/creative/CR06126236974719172609?region=IN", fetched: CHECK_DATE, ad: { format: "image", days: 65 } },
    ],
  },
];

export const AD_CREATIVE = {
  brand: "SUGAR Cosmetics",
  image: "https://tpc.googlesyndication.com/archive/simgad/1624764746756811158",
  width: 600,
  height: 1200,
  format: "Image ad",
  totalDaysShown: 51,
  url: "https://adstransparency.google.com/advertiser/AR09004105641337290753/creative/CR05157791118703722497?region=IN",
  fetched: CHECK_DATE,
};

export const NUMBERS = {
  sources: 5,
  brands: 5,
  findings: "1,111",
  tagged: "329",
  withHook: String(HOOK_MATRIX.reduce((n, b) => n + b.total, 0)),
  searchesPerBrand: "7",
};
