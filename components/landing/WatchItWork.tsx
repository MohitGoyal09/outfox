"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { animate, motion, useInView } from "motion/react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { cn } from "@/lib/utils";
import { AD_CREATIVE, RIBBON, SOURCES, SUGAR_READ_ADS } from "./landing-data";

const PROMPT = "Which ad is SUGAR betting on?";

type AdRow = { headline: string; domain: string; days: number; desc?: string };

const SUGAR_ADS = RIBBON.flatMap((r) => (r.kind === "ad" && r.brand === "SUGAR Cosmetics" ? [r] : []));
const ROWS: readonly AdRow[] = [
  { headline: byDays(159)?.headline ?? "Ad creative", domain: byDays(159)?.domain ?? "sugarcosmetics.com", days: 159 },
  { ...SUGAR_READ_ADS.d51, days: AD_CREATIVE.totalDaysShown },
  { headline: byDays(192)?.headline ?? "Ad creative", domain: byDays(192)?.domain ?? "sugarcosmetics.com", days: 192 },
];
const SUGAR_ADS_PAGE = "https://adstransparency.google.com/advertiser/AR01253600073510551553?region=IN";

const SKIPPED_ENGINE = "youtube";

const TYPE_START = 300;
const TYPE_MS = 40;
const SRC_START = 1700;
const SRC_STEP = 380;
const ROWS_START = 3500;
const ROW_STAGGER = 90;
const SCAN_START = 4300;
const SCAN_STEP = 330;
const PICK_AT = SCAN_START + ROWS.length * SCAN_STEP + 100;
const RESULT_AT = PICK_AT + 350;
const END = RESULT_AT + 900;

function Dots() {
  return (
    <span aria-hidden="true" className="flex gap-1.5">
      
    </span>
  );
}

function SourceStep({ engine, name, t, i }: { engine: string; name: string; t: number; i: number }) {
  const state = t >= at ? (skipped ? "skipped" : "done") : t >= at - SRC_STEP * 0.6 && t >= SRC_START - 200 ? "reading" : "idle";
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[12px] leading-none transition-colors duration-300",
        state === "skipped" ? "border-warn/40 bg-warn/10 text-fg" : "border-border bg-bg-raised text-fg-secondary",
        state === "idle" && "opacity-40",
      )}
    >
      <PlatformLogo engine={engine} className="size-3.5" />
      <span className="whitespace-nowrap">{skipped ? "YouTube engagement · not checked" : name}</span>
      <span aria-hidden="true" className="flex size-3.5 items-center justify-center">
        
        
        
      </span>
      
      {state === "skipped" && <span className="sr-only">skipped</span>}
    </li>
  );
}

export function WatchItWork() {
  const reduce = useReducedMotion() ?? false;
  const inView = useInView(ref, { amount: 0.45 });
  const [tRaw, setT] = useState(0);

  useEffect(() => {
    if (reduce || !inView) return;
    const c = animate(0, END, { duration: END / 1000, ease: "linear", onUpdate: (v) => setT(v) });
    return () => {
      c.stop();
      setT(0);
    };
  }, [inView, reduce]);
  const t = reduce ? END : tRaw;

  const typed = PROMPT.slice(0, Math.max(0, Math.min(PROMPT.length, Math.floor((t - TYPE_START) / TYPE_MS) + 1)));
  const typing = t >= TYPE_START && typed.length < PROMPT.length;
  const sourcesOn = t >= SRC_START - 200;
}
