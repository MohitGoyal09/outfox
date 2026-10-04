"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { cn } from "@/lib/utils";
import { CHECK_DATE, HERO_CLAIM, TRAIL_EVIDENCE, type Evidence } from "./landing-data";
import { DotGrid } from "./DotGrid";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Pt = { x: number; y: number };
type Geometry = { w: number; h: number; stacked: boolean; start: Pt; ends: Pt[]; trunkY: number; railX: number };

const FALLBACK: Geometry = {
  w: 600,
  h: 470,
  stacked: false,
  start: { x: 90, y: 168 },
  ends: [
    { x: 100, y: 270 },
    { x: 300, y: 270 },
    { x: 500, y: 270 },
  ],
  trunkY: 0,
  railX: 0,
};

const R_START = 5.5;

export function trailPaths(g: Geometry): string[] {
  const y0 = start.y + R_START;
  return ends.map((e) => {
    const dy = e.y - y0;
    return `M${start.x} ${y0} C${start.x} ${y0 + dy * 0.55}, ${e.x} ${e.y - dy * 0.45}, ${e.x} ${e.y}`;
  });
}

const cardClass =
  "group flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-bg-raised shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

function CardFoot({ item }: { item: Evidence }) {
  return (
    <>
      <EngineTag engine={item.engine} />
      <p className="num text-[11px] text-fg-tertiary">Fetched {item.fetched}</p>
    </>
  );
}

function EvidenceCard({ item }: { item: Evidence }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={cardClass}>
      <img src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`} alt="" width={480} height={360} loading="eager" className="aspect-video w-full object-cover" />
      
    </a>
  );
}

export function TrailVisual({ className }: { className?: string }) {
  const c = HERO_CLAIM;
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [geo, setGeo] = useState<Geometry>(FALLBACK);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const num = numRef.current;
    const cards = cardRefs.current.filter((el): el is HTMLLIElement => el !== null);
    if (!stage || !num || !claim || cards.length === 0) return;
    const o = stage.getBoundingClientRect();
    const n = num.getBoundingClientRect();
    const rects = cards.map((el) => el.getBoundingClientRect());
    const stacked = rects.length > 1 && rects[1].top >= rects[0].bottom - 1;
    const start = { x: n.left - o.left + n.width / 2, y: n.bottom - o.top + 8 };
    const ends = rects.map((r, i) =>
      stacked
        ? { x: r.left - o.left + parseFloat(getComputedStyle(cards[i]).paddingLeft), y: r.top - o.top + r.height / 2 }
        : { x: r.left - o.left + r.width / 2, y: r.top - o.top },
    );
    setGeo({ w: o.width, h: o.height, stacked, start, ends, trunkY: k.bottom - o.top + 14, railX: 5.5 });
  }, []);

  useIsoLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (claimRef.current) ro.observe(claimRef.current);
  }, [measure]);

  const paths = trailPaths(geo);

  return (
    <figure className={cn("relative isolate", className)}>
      <DotGrid className="l-fade absolute -inset-x-6 -inset-y-10 -z-10 h-[calc(100%+5rem)] w-[calc(100%+3rem)]" />

      

      <figcaption className="mt-5 text-[13px] leading-[1.45] text-fg-secondary">
        A real finding from a check on . Every line ends at a public source.
      </figcaption>
    </figure>
  );
}
