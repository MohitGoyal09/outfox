"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { Image as ImageIcon, MousePointerClick, Pause, Play, Video } from "lucide-react";
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

function CardFoot({ item }: { item: Evidence }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border p-3 text-[11px] leading-[1.35]">
      
      
      <span className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] transition-colors group-hover:decoration-fg">Open source ↗</span>
    </div>
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
  const maxDays = Math.max(1, ...f.evidence.map((e) => e.ad?.days ?? 0));
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
