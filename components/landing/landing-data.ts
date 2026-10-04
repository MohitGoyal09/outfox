
export const CHECK_DATE = "4 Oct 2026";

export const HOOK_MATRIX = [
  { name: "SUGAR Cosmetics", total: 40, counts: { discount_offer: 1, social_proof: 3, founder_story: 2, problem_solution: 2, product_feature: 12, urgency_scarcity: 0, education_explainer: 16, visual_cold_open: 4 } },
  { name: "Plum", total: 31, counts: { discount_offer: 4, social_proof: 6, founder_story: 6, problem_solution: 0, product_feature: 3, urgency_scarcity: 1, education_explainer: 2, visual_cold_open: 9 } },
  { name: "Minimalist", total: 27, counts: { discount_offer: 1, social_proof: 7, founder_story: 3, problem_solution: 6, product_feature: 3, urgency_scarcity: 0, education_explainer: 6, visual_cold_open: 1 } },
  { name: "Mamaearth", total: 24, counts: { discount_offer: 4, social_proof: 3, founder_story: 0, problem_solution: 2, product_feature: 6, urgency_scarcity: 0, education_explainer: 7, visual_cold_open: 2 } },
  { name: "WOW Skin Science", total: 15, counts: { discount_offer: 0, social_proof: 2, founder_story: 3, problem_solution: 0, product_feature: 4, urgency_scarcity: 0, education_explainer: 4, visual_cold_open: 2 } },
] as const;

export const HERO_CLAIM = {
  brand: "SUGAR Cosmetics",
  hook: "Explainer",
  brandShare: "40%",
  brandCount: 16,
  brandTotal: 40,
  othersShare: "20%",
  othersBrands: 4,
};

export type Evidence = {
  engine: "youtube_video" | "google_news";
  title: string;
  where: string;
  url: string;
  fetched: string;
  videoId?: string;
};

export const TRAIL_EVIDENCE: readonly Evidence[] = [
  {
    engine: "youtube_video",
    title: "Makeup Tutorial in 5 Minutes | Easy Indian Makeup Look | SUGAR Cosmetics",
    where: "youtube.com",
    url: "https://www.youtube.com/watch?v=KoGsqgErT0c",
    fetched: CHECK_DATE,
    videoId: "KoGsqgErT0c",
  },
  {
    engine: "youtube_video",
    title: "Makeup Tutorial For Dry Skin VS Oily Skin | SUGAR Cosmetics",
    where: "youtube.com",
    url: "https://www.youtube.com/watch?v=xNQXM0IMLQY",
    fetched: CHECK_DATE,
    videoId: "xNQXM0IMLQY",
  },
  {
    engine: "google_news",
    title: "SUGAR Cosmetics Launches ‘Sugarquoted’, India’s First Beauty Education Podcast",
    where: "infashionbusiness.com",
    url: "https://infashionbusiness.com/home/news_details/7156/14",
    fetched: CHECK_DATE,
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

export const SOURCES = [
  { engine: "google", name: "Google Search", gives: "Which pages come up for a brand's search terms, and what they promise." },
  { engine: "google_ads_transparency_center", name: "Google Ads Transparency", gives: "Ads a brand ran, with dates. Not spend." },
  { engine: "youtube", name: "YouTube", gives: "Videos about the brand and by it, with titles and channels." },
  { engine: "google_news", name: "Google News", gives: "News coverage of the brand, with the publisher and date." },
  { engine: "google_trends", name: "Google Trends", gives: "Relative search interest over time. Not sales." },
] as const;
