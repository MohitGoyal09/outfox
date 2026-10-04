"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { MousePointerClick, Pause, Play } from "lucide-react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/components/aceternity/motion-utils";
import { AnimatedNumber } from "@/components/aceternity/animated-number";
import { useMedia } from "./HeroBackdrop";
import { CHECK_DATE, HERO_FINDINGS, type Evidence, type HeroFinding } from "./landing-data";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Pt = { x: number; y: number };
type Geometry = { w: number; h: number; start: Pt; ends: Pt[] };

const R_START = 5.5;
const CLAIM_DELAY_S = 0.9;
const FIRST_DRAW_DELAY_S = 1.6;
const CYCLE_MS = 6000;
const TRAVEL_S = 0.9;

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];

export function trailPaths(g: Geometry): string[] {
  const y0 = start.y + R_START;
  return ends.map((e) => {
    const dy = e.y - y0;
    return `M${start.x} ${y0} C${start.x} ${y0 + dy * 0.55}, ${e.x} ${e.y - dy * 0.45}, ${e.x} ${e.y}`;
  });
}
const cardClass = cn(
  "group flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-bg-raised shadow-xs transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
  LIFT,
);

const shortDate = (d: string) => d.replace(/\s\d{4}$/, "");

const GLYPHS = " .:-=+*#";
const TRACE_OFF = "transition-opacity duration-500 group-data-[tracing=true]/trail:opacity-0 group-hover:opacity-0";

const DOTS = "[background-image:radial-gradient(circle,rgba(255,255,255,0.9)_45%,transparent_52%)] [background-size:3px_3px]";

function Glyphs({ seed }: { seed: string }) {
  return (
    <pre aria-hidden="true" className="num absolute inset-0 m-0 select-none overflow-hidden whitespace-pre text-[9px] leading-[1.15] text-[#D69696]">
      {glyphField(seed)}
    </pre>
  );
}

function Media({ item }: { item: Evidence }) {
  if (item.videoId) {
    return (
      <span className={MEDIA}>
        <img src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`} alt="" width={480} height={360} loading="eager" className="absolute inset-0 size-full object-cover [filter:grayscale(1)_contrast(1.25)_brightness(1.1)] transition-[filter] duration-500 group-data-[tracing=true]/trail:[filter:none] group-hover:[filter:none]" />
        <span aria-hidden="true" className={cn("absolute inset-0 bg-[#D69696] mix-blend-multiply", TRACE_OFF)} />
        
      </span>
    );
  }
  return (
    <span className={MEDIA}>
      <Glyphs seed={item.url} />
      <span className={monoChip}>{item.where}</span>
    </span>
  );
}

function EvidenceCard({ item }: { item: Evidence }) {
  const ad = item.ad;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={cardClass}>
      
      <span className="flex flex-1 flex-col gap-2 p-3">
        <span className="num flex min-h-[2.5em] items-start gap-1.5 text-[11px] min-[1180px]:text-xs leading-[1.25] text-fg-secondary">
          <PlatformLogo engine={item.engine} className="mt-px size-3.5 shrink-0" />
          
        </span>
        <span className="line-clamp-3 text-[15px] font-medium leading-[1.35] text-fg">{title}</span>
      </span>
      <span className="num flex items-center justify-between gap-2 border-t border-border px-2.5 py-2 text-xs leading-none">
        <span className="whitespace-nowrap text-fg-tertiary"><span className="hidden min-[1180px]:inline">fetched </span>{shortDate(item.fetched)}</span>
        <span className="whitespace-nowrap font-medium text-fg">Open ↗</span>
      </span>
    </a>
  );
}

const withArticle = (word: string) => `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;

function summary(f: HeroFinding) {
  const hook = f.hook.toLowerCase();
  return `${f.brandShare}% of ${f.brand}'s tagged findings lead with ${withArticle(hook)}. The other ${NUMBER_WORDS[f.othersBrands] ?? f.othersBrands} brands: ${f.othersShare}%.`;
}

export function TrailVisual({ className }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [geo, setGeo] = useState<Geometry>(FALLBACK);
  const [idx, setIdx] = useState(0);
  const [switched, setSwitched] = useState(false);
  const [lines, setLines] = useState(true);
  const [hold, setHold] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hot, setHot] = useState(false);
  const [pinned, setPinned] = useState(false);
  const tracing = hot || pinned;
  const reduce = useReducedMotion();
  const everInView = useInView(stageRef, { once: true, amount: 0.3 });
  const f = HERO_FINDINGS[idx];
  const drawn = (Boolean(reduce) || everInView) && lines;

  const go = useCallback(
    (next: number) => {
      if (timer.current) clearTimeout(timer.current);
      setSwitched(true);
      setPinned(false);
      if (reduce) {
        setIdx(next);
        return;
      }
      timer.current = setTimeout(() => {
        setIdx(next);
        setLines(true);
      }, UNDRAW_MS);
    },
    [idx, reduce],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const num = claimRef.current?.querySelector<HTMLElement>("#trail-num-40") ?? null;
    const cards = cardRefs.current.filter((el): el is HTMLLIElement => el !== null);
    if (!stage || !num || cards.length === 0) return;
    const o = stage.getBoundingClientRect();
    const n = num.getBoundingClientRect();
    setGeo({
      w: o.width,
      h: o.height,
      start: { x: n.left - o.left + n.width / 2, y: n.bottom - o.top + 8 },
      ends: cards.map((el) => {
        return { x: r.left - o.left + r.width / 2, y: r.top - o.top };
      }),
    });
  }, []);

  useIsoLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (claimRef.current) ro.observe(claimRef.current);
    if (num) ro.observe(num);
  }, [measure]);

  const paths = trailPaths(geo);
  const dim = "transition-opacity duration-500 group-data-[tracing=true]/trail:opacity-50";
  const figureText = `${f.brand} leans on ${f.hook.toLowerCase()}s.`;
  const firstDraw = reduce || switched ? 0 : FIRST_DRAW_DELAY_S;

  return (
    <figure
      data-tracing={tracing}
      className={cn("group/trail contents md:relative md:block", className)}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      

      <figcaption className="order-5 flex items-center justify-end md:mt-2">
        <span role="group" aria-label="Choose a finding" className="flex items-center">
          
          
        </span>
      </figcaption>
    </figure>
  );
}
