"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { ChevronsLeftRight, Link2Off, ScanSearch, ShieldOff } from "lucide-react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { CHECK_DATE, HOOK_MATRIX, SUGAR_LONGEST_AD } from "./landing-data";

const SUGAR = HOOK_MATRIX[0];
const END = 50;
const STEP = 5;

type Slot = { label: string; value: string; text: React.ReactNode; chip: string; href?: string; accent?: string };

const PROOF: readonly Slot[] = [
  {
    label: "Spend",
    value: `${SUGAR_LONGEST_AD.days} days`,
    text: "SUGAR's longest-running Google ad. Google's own days-shown count.",
    chip: `Google Ads Transparency · fetched ${CHECK_DATE}`,
    href: SUGAR_LONGEST_AD.url,
    accent: "var(--hook-education-explainer)",
  },
  {
    label: "Engagement",
    value: "Not checked",
    text: "Engagement was not measured in this check, so it is never shown as zero.",
    chip: "Source status: not checked",
    accent: "var(--hook-product-feature)",
  },
  {
    label: "ROAS",
    value: `${SUGAR.counts.education_explainer} of ${SUGAR.total}`,
    text: (
      <>
        tagged SUGAR findings open with an explainer hook <span className="font-mono text-[0.75rem]">[1]</span>. No source, no number.
      </>
    ),
    chip: "[1] Latest check",
    accent: "var(--hook-founder-story)",
  },
];

function Layer({ proof, mobile = false }: { proof: boolean; mobile?: boolean }) {
  return (
    <div className={`flex h-full flex-col gap-3 p-5 md:p-7 ${proof ? "bg-[#f4f5f9] text-[#111113]" : `bg-[#25262b] text-[#c9cad1] ${mobile ? "" : "saturate-50"}`}`}>
      <p className={`h-8 max-w-[14rem] font-mono text-[0.6875rem] uppercase leading-[1.5] tracking-[0.06em] ${proof ? "text-[#52525b] md:max-w-none md:self-end md:text-right" : ""}`}>
        {proof ? "What Drishti shows" : "Illustrative: what estimate-based tools show"}
      </p>
      
    </div>
  );
}

function CompareSlider() {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const pos = useMotionValue(START);
  useMotionValueEvent(pos, "change", (p) => setNow(Math.round(p)));

  useEffect(() => {
    if (reduced) pos.set(50);
  }, [reduced, pos]);

  useEffect(() => {
    if (!inView || reduced) return;
    sweep.current = animate(pos, END, { duration: 1.2, ease: EASE_OUT });
    return () => sweep.current?.stop();
  }, [inView, reduced, pos]);

  const onKey = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowLeft: pos.get() - STEP, ArrowDown: pos.get() - STEP, ArrowRight: pos.get() + STEP, ArrowUp: pos.get() + STEP, Home: 0, End: 100,
    };
    if (!(e.key in keys)) return;
    take();
    pos.set(clamp(keys[e.key]));
  };

  return (
    <div
      ref={wrap}
      onPointerDown={(e) => {
        take();
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromX(e.clientX);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && setFromX(e.clientX)}
      className="relative hidden h-[330px] cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-3xl border border-white/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] md:block"
    >
      <div className="absolute inset-0"><Layer proof={false} /></div>
      <motion.div className="absolute inset-0 will-change-[clip-path]" style={{ clipPath: clip }}><Layer proof /></motion.div>
      
      <motion.div className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={{ left }}>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare estimate tools with Drishti"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={now}
          aria-valuetext={`Drishti shown from ${now}% across`}
          onKeyDown={onKey}
          onFocus={take}
          className="grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white text-[#111113] shadow-[0_8px_24px_rgba(0,0,0,0.35)] outline-none transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#60a5fa]"
        >
          <ChevronsLeftRight size={22} aria-hidden="true" />
        </div>
      </motion.div>
    </div>
  );
}

function StackedCompare() {
  return (
    <div className="grid gap-3 md:hidden">
      
      
    </div>
  );
}
