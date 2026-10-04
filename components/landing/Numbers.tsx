"use client";

import { useState } from "react";
import { ChartLine } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { hookName } from "@/components/drishti/labels";
import { HOOK_COLOR } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";
import { CHECK_DATE, HOOK_MATRIX, HOOK_ORDER } from "./landing-data";

type Hook = (typeof HOOK_ORDER)[number];

const Y_MAX = 50;
const TICKS = [0, 10, 20, 30, 40, 50];
const EASE = [0.22, 1, 0.36, 1] as const;

const shares = (h: Hook) => HOOK_MATRIX.map((b) => (b.counts[h] / b.total) * 100);
const spread = (h: Hook) => {
  const s = shares(h);
  return Math.max(...s) - Math.min(...s);
};
const CHOICES = [...HOOK_ORDER].sort((a, b) => spread(b) - spread(a)).slice(0, 4);
const yPct = (v: number) => 100 - (v / Y_MAX) * 100;
const shortName = (n: string) => n.split(" ")[0];

export function Numbers() {
  const reduce = useReducedMotion();
  const values = shares(hook);
  const pts = values.map((v, i) => [xPct(i), yPct(v)] as const);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    (e.currentTarget.parentElement?.querySelector(`[data-hook="${next}"]`) as HTMLElement | null)?.focus();
  };

  return (
    <section aria-labelledby="numbers-heading" className="l-wrap pb-20 pt-16 lg:pb-28 lg:pt-24">
      <p className="l-eyebrow">
        From the demo workspace, check of 
      </p>
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        
        
      </div>

      <div className="mt-8 h-[22rem] rounded-[20px] border border-border bg-bg-raised sm:h-[32.5rem]">
        <div role="img" aria-label={label} className="relative size-full">
          <div className="absolute inset-y-0 left-12 right-4 sm:right-8">
            <div className="absolute inset-x-0 bottom-10 top-16">
              {TICKS.map((v) => (
                <div key={v} className="absolute inset-x-0" style={{ top: `${yPct(v)}%` }}>
                  <span className="num absolute -left-12 w-9 -translate-y-1/2 text-right text-[11px] text-fg-tertiary">{v}%</span>
                  <div className="h-px bg-border" />
                </div>
              ))}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
                
              </svg>
              {HOOK_MATRIX.map((b, i) => (
                <motion.div key={b.name} initial={false} animate={{ top: `${pts[i][1]}%` }} transition={t} className="absolute" style={{ left: `${xPct(i)}%` }}>
                  <span aria-hidden="true" className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-fg" style={{ backgroundColor: HOOK_COLOR[hook] }} />
                  
                </motion.div>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
