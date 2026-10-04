"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, RotateCcw } from "lucide-react";
import { animate, motion, useInView } from "motion/react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { cn } from "@/lib/utils";
import { AD_CREATIVE, CHECK_DATE, RIBBON, SOURCES, SUGAR_LONGEST_AD } from "./landing-data";

const PROMPT = "Which ad is SUGAR betting on?";

type AdRow = { headline: string; domain: string; days: number };

const SUGAR_ADS = RIBBON.flatMap((r) => (r.kind === "ad" && r.brand === "SUGAR Cosmetics" ? [r] : []));
const ROWS: readonly AdRow[] = [
  { headline: byDays(159)?.headline ?? "Ad creative", domain: byDays(159)?.domain ?? "sugarcosmetics.com", days: 159 },
  { headline: "Image ad, headline not captured", domain: "adstransparency.google.com", days: AD_CREATIVE.totalDaysShown },
  { headline: byDays(192)?.headline ?? "Ad creative", domain: byDays(192)?.domain ?? "sugarcosmetics.com", days: 192 },
  { headline: "Ad creative, headline not captured", domain: "adstransparency.google.com", days: SUGAR_LONGEST_AD.days },
];

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

function AdRowView({ row, i, t, reduce }: { row: AdRow; i: number; t: number; reduce: boolean }) {
  const shown = t >= ROWS_START + i * ROW_STAGGER;
  const picked = t >= PICK_AT;
  const win = picked && i === WINNER;
  const dim = picked && i !== WINNER;
  return (
    <motion.li
      initial={false}
      animate={{ opacity: shown ? (dim ? 0.45 : 1) : 0, y: shown ? 0 : 10, scale: win ? 1.015 : 1 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: EASE_OUT }}
      className={cn(
        "relative flex flex-col gap-2 rounded-[12px] border bg-white px-3.5 py-3 sm:flex-row sm:items-center sm:gap-4",
        win ? "border-transparent shadow-[0_14px_30px_-16px_rgba(17,17,19,0.45)] ring-2 ring-fg" : scanning ? "border-border-strong bg-bg-inset" : "border-border",
      )}
    >
      <span className="min-w-0 flex-1">
        
        <span className="num mt-0.5 block truncate text-[11px] leading-tight text-fg-tertiary">{row.domain}</span>
      </span>
      
    </motion.li>
  );
}
