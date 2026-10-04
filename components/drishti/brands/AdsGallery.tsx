"use client";

import { useMemo, useState } from "react";
import { Clapperboard } from "lucide-react";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";
import { adGalleryRows, type AdGalleryRow, type ClaimDoc } from "./brand-model";
import { isBrokenAdPreview } from "./ad-preview";
import { shortDate } from "./format";

const INITIAL_COUNT = 12;

function AdCard({ row }: { row: AdGalleryRow }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = row.imageUrl !== null && !imageFailed;
  const dates =
    row.firstShown && row.lastShown
      ? `${shortDate(row.firstShown)} to ${shortDate(row.lastShown)}`
      : row.firstShown
        ? `First seen ${shortDate(row.firstShown)}`
        : row.lastShown
          ? `Last seen ${shortDate(row.lastShown)}`
          : null;
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3 text-xs">
      {showImage ? (
        <img
          src={row.imageUrl ?? undefined}
          onError={() => setImageFailed(true)}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (isBrokenAdPreview(naturalWidth, naturalHeight)) setImageFailed(true);
          }}
          alt={`${row.formatWord} creative`} loading="lazy"
          className="aspect-[4/3] w-full rounded-md border border-border bg-muted object-contain" />
      ) : null}
      <p className="font-semibold text-fg">{row.formatWord}</p>
      {dates ? <p className="font-mono tabular-nums text-muted-foreground">{dates}</p> : null}
      {row.runDays !== null ? <p className="text-muted-foreground">Ran for <span className="font-mono tabular-nums text-fg">{row.runDays}</span> days</p> : null}
      {row.linkUrl ? (
        <a href={row.linkUrl} target="_blank" rel="noreferrer noopener" className="mt-auto text-accent hover:underline">
          View on Ads Transparency
        </a>
      ) : null}
    </li>
  );
}

export function AdsGallery({ claims }: { claims: ClaimDoc[] }) {
  const rows = useMemo(() => adGalleryRows(claims), [claims]);
  const [showAll, setShowAll] = useState(false);
  if (rows.length === 0) return null;
  const visible = showAll ? rows : rows.slice(0, INITIAL_COUNT);
  const hasAnyImage = rows.some((row) => row.imageUrl !== null);
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Clapperboard className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Ads we found"
            definition="Google Ads Transparency creatives from the latest check, newest first. Images, dates and run length show only when the source gave them. Run length is how long the ad stayed live, not budget, reach, or spend."
          />
        </h3>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">{rows.length}</span>
      </div>
      <div className="space-y-3 p-4">
        {!hasAnyImage ? <p className="text-xs text-muted-foreground">Images were not stored for these ads.</p> : null}
        <ul className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((row) => (
            <AdCard key={row.claimId} row={row} />
          ))}
        </ul>
        {rows.length > INITIAL_COUNT ? (
          <button type="button" onClick={() => setShowAll((value) => !value)} className="text-sm text-accent hover:underline">
            {showAll ? "Show fewer" : `Show all ${rows.length}`}
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
