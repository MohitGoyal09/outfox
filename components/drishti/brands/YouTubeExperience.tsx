"use client";

import { useMemo, useState } from "react";
import { Filter, Tag, Video } from "lucide-react";
import { HOOK_TYPES, FUNNEL_STAGES, iconProps } from "../tokens";
import { hookName, stageName } from "@/components/drishti/labels";
import { EmptyState } from "../EmptyState";
import {
  findYoutubeRawVideo,
  funnelDistribution,
  groupYoutubeVideoClaims,
  hookDistribution,
  mostRecentTaggedRunForEngines,
  previousRunFor,
  readYoutubeRawVideo,
  runHasRealTagForEngines,
  tagsForEngineSubset,
  type ClaimDoc,
  type RunDoc,
  type SnapshotDoc,
  type YoutubeVideoGroup,
} from "./brand-model";
import { FilterSelect, FunnelPanel, HookChart, SummaryPanel } from "./EvidencePanels";
import { MetricInfo } from "../MetricInfo";
import { shortDate } from "./format";
import { YouTubeVideoCard } from "./YouTubeVideoCard";

const YOUTUBE_VIDEO_ENGINE = ["youtube_video"] as const;

function tagsForGroup(tags: ClaimDoc[], group: YoutubeVideoGroup): ClaimDoc[] {
  const claimIds = new Set(group.claims.map((claim) => String(claim._id)));
  return tags.filter(
    (tag) =>
      claimIds.has(String(tag._id)) ||
      (tag.taggedClaimId !== undefined && claimIds.has(String(tag.taggedClaimId))),
  );
}

export function YouTubeExperience({
  claims,
  runsDesc,
  latestRunId,
  snapshot,
}: {
  claims: ClaimDoc[];
  runsDesc: RunDoc[];
  latestRunId: string | null;
  snapshot: SnapshotDoc | undefined;
}) {
  const [hookFilter, setHookFilter] = useState("all");
  const [funnelFilter, setFunnelFilter] = useState("all");

  const videoClaims = useMemo(
    () => claims.filter((claim) => claim.sourceEngine === "youtube_video"),
    [claims],
  );
  const latestSubset = useMemo(
    () => (latestRunId ? videoClaims.filter((claim) => String(claim.runId) === latestRunId) : []),
    [videoClaims, latestRunId],
  );
  const cardFilterTags = latestRunId ? tagsForEngineSubset(claims, latestRunId, YOUTUBE_VIDEO_ENGINE) : [];

  const hasLatestVideoTags = latestRunId ? runHasRealTagForEngines(claims, latestRunId, YOUTUBE_VIDEO_ENGINE) : false;
  const videoFallbackRun = !hasLatestVideoTags ? mostRecentTaggedRunForEngines(claims, runsDesc, YOUTUBE_VIDEO_ENGINE) : null;
  const hookFunnelRunId = videoFallbackRun ? String(videoFallbackRun._id) : latestRunId;
  const hookFunnelPreviousRunId = hookFunnelRunId ? previousRunFor(claims, hookFunnelRunId) : null;
  const miniPanelTags = hookFunnelRunId ? tagsForEngineSubset(claims, hookFunnelRunId, YOUTUBE_VIDEO_ENGINE) : [];
  const previousMiniPanelTags = useMemo(() => {
    if (hookFunnelPreviousRunId === null) return null;
    const rows = tagsForEngineSubset(claims, hookFunnelPreviousRunId, YOUTUBE_VIDEO_ENGINE);
    return rows.length > 0 ? rows : null;
  }, [claims, hookFunnelPreviousRunId]);
  const hookItems = hookDistribution(miniPanelTags, previousMiniPanelTags);
  const funnelItems = funnelDistribution(miniPanelTags, previousMiniPanelTags);
  const hookFunnelTotalFindings = hookFunnelRunId
    ? videoClaims.filter((claim) => String(claim.runId) === hookFunnelRunId).length
    : null;
  const videoFallbackLabel = videoFallbackRun ? (
    <p className="mt-1 font-mono text-[10px] text-muted-foreground">from the run on {shortDate(videoFallbackRun.requestedAt)}</p>
  ) : undefined;

  const allGroups = useMemo(() => groupYoutubeVideoClaims(latestSubset), [latestSubset]);
  const groups = allGroups.filter((group) => {
    if (hookFilter === "all" && funnelFilter === "all") return true;
    const tags = tagsForGroup(cardFilterTags, group);
    return (
      (hookFilter === "all" || tags.some((tag) => tag.hookType === hookFilter)) &&
      (funnelFilter === "all" || tags.some((tag) => tag.funnelStage === funnelFilter))
    );
  });
  const rawResponse = snapshot?.rawResponse;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <SummaryPanel
          title={
            <MetricInfo
              label="Top hooks (YouTube)"
              definition="How often each hook type was tagged across this tab's video findings. It counts tagged findings, not videos or views, and shares are of tagged findings only."
            />
          }
          subtitle={videoFallbackLabel}
        >
          <HookChart items={hookItems} taggedCount={miniPanelTags.length} totalFindings={hookFunnelTotalFindings} />
        </SummaryPanel>
        <SummaryPanel
          title={
            <MetricInfo
              label="Funnel stage (YouTube)"
              definition="Each tagged video finding's audience stage. Stages are tags, not a conversion path, so the shares sum to 100% and nobody drops out between rows."
            />
          }
          subtitle={videoFallbackLabel}
        >
          <FunnelPanel items={funnelItems} taggedCount={miniPanelTags.length} totalFindings={hookFunnelTotalFindings} />
        </SummaryPanel>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect icon={Tag} label="All hooks" value={hookFilter} onChange={setHookFilter} options={HOOK_TYPES.map((hook) => ({ value: hook, label: hookName(hook) }))} />
        <FilterSelect icon={Filter} label="All funnel stages" value={funnelFilter} onChange={setFunnelFilter} options={FUNNEL_STAGES.map((stage) => ({ value: stage, label: stageName(stage) }))} />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Video className="size-4 text-fg" aria-hidden />
          <h2 className="type-headline text-fg">
            {groups.length}{" "}
            <MetricInfo
              label={groups.length === 1 ? "video" : "videos"}
              definition="Real stored YouTube videos for this check, one card per video rather than one row per field. Missing view or like counts stay missing, never zero."
            />
          </h2>
        </div>
        {groups.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <YouTubeVideoCard key={group.evidenceUrl} group={group} raw={readYoutubeRawVideo(findYoutubeRawVideo(rawResponse, group.videoId))} />
            ))}
          </div>
        ) : (
          <EmptyState
            bounded
            icon={<Video {...iconProps} size={16} />}
            title={videoClaims.length === 0 ? "No YouTube video evidence for this run." : "No videos match these filters."}
            description={videoClaims.length === 0 ? "Video detail is captured by a YouTube video check. Run one for this brand to fill this grid in." : "Clear a hook or funnel filter above to see the videos this run did capture."}
          />
        )}
      </div>
    </div>
  );
}
