

export function sourceName(engine: string): string {
  return SOURCE_NAMES[engine] ?? humanize(engine);
}

export function hookName(hook: string): string {
  return HOOK_NAMES[hook] ?? humanize(hook);
}

const STAGE_NAMES: Readonly<Record<string, string>> = {
  unaware: "Doesn't know the problem",
  problem_aware: "Knows the problem",
  solution_aware: "Comparing solutions",
  product_aware: "Knows the brand",
  most_aware: "Ready to buy",
  not_applicable: "No clear stage",
};

export function stageName(stage: string): string {
  return STAGE_NAMES[stage] ?? humanize(stage);
}

export function nameEnumsInText(text: string): string {
  return text.replace(/\b[a-z]+(?:_[a-z]+)+\b/g, (token) => {
    const name = HOOK_NAMES[token] ?? STAGE_NAMES[token];
    return name === undefined ? token : name.charAt(0).toLowerCase() + name.slice(1);
  });
}

const MEASURE_NAMES: Readonly<Record<string, string>> = {
  ads_transparency_active_creative_count: "Ads running",
  ads_transparency_creative: "Ad creative",
  brand_knowledge_attribute: "Brand detail",
  brand_knowledge_description: "Brand description",
  content_tag: "Content tag",
  google_ad_result: "Google ad",
  google_ai_overview: "Google AI overview",
  google_news_publisher: "News publisher",
  google_news_result: "News article",
  google_organic_result: "Google result",
  google_organic_result_count: "Google results found",
  google_product_listing: "Shopping listing",
  google_related_question: "People also ask",
  google_related_search: "Related search",
  google_trends_avg_interest: "Average search interest",
  google_trends_interest_point: "Search interest",
  youtube_ad_result: "YouTube ad",
  youtube_channel_subscribers: "Subscribers",
  youtube_description_link: "Link in description",
  youtube_related_video: "Related video",
  youtube_search_result_count: "YouTube results found",
  youtube_shopping_result: "YouTube shopping listing",
  youtube_short_result: "YouTube Short",
  youtube_video_description: "Video description",
  youtube_video_length: "Video length",
  youtube_video_like_count: "Likes",
  youtube_video_published_date: "Published",
  youtube_video_title: "Video title",
  youtube_video_view_count: "Views",
};

export function hasMeasureName(metric: string): boolean {
  return Object.prototype.hasOwnProperty.call(MEASURE_NAMES, metric);
}

export function checkedStateLabel(state: "ok" | "stale" | "missing" | "not_run" | string): string {
  switch (state) {
    case "ok":
      return "Checked";
    case "stale":
      return "Checked earlier";
    case "missing":
      return "Nothing found";
    case "not_run":
      return "Not checked yet";
    default:
      return humanize(state);
  }
}
