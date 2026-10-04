"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { ChevronsLeftRight, Link2Off, ScanSearch, ShieldOff } from "lucide-react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { CHECK_DATE, HOOK_MATRIX, SUGAR_LONGEST_AD } from "./landing-data";

const SUGAR = HOOK_MATRIX[0];
const END = 25;
const STEP = 5;

function Spark({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 120 32" aria-hidden="true" className="hidden h-14 w-full text-white/25 md:block">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ESTIMATES = [
  { label: "Estimated spend", value: "₹12–18L / mo", d: "M2 24 L20 18 L38 22 L56 12 L74 16 L92 8 L118 10" },
  { label: "Engagement rate", value: "4.8%", d: "M2 14 L20 20 L38 10 L56 18 L74 12 L92 20 L118 14" },
  { label: "ROAS", value: "3.4x", d: "M2 26 L20 22 L38 24 L56 16 L74 18 L92 10 L118 6" },
] as const;

function EstimateLayer({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`flex h-full flex-col gap-4 bg-[#25262b] p-5 text-[#c9cad1] md:p-8 ${mobile ? "" : "saturate-50"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="max-w-[14rem] font-mono text-[0.6875rem] uppercase leading-[1.5] tracking-[0.06em] text-[#c9cad1]">Illustrative: what estimate-based tools show</p>
      </div>
      <p className="font-display text-[1.125rem] font-medium text-white/70">SUGAR Cosmetics · competitor overview</p>
      
    </div>
  );
}

function DrishtiLayer() {
  return (
    <div className="flex h-full flex-col gap-4 bg-[#f4f5f9] p-5 text-[#111113] md:p-8">
      
      
      <ul className="m-0 grid flex-1 list-none grid-cols-1 gap-3 p-0 md:grid-cols-3 md:gap-4">
        <li style={{ borderTopColor: "var(--hook-education-explainer)" }} className="flex flex-col gap-3 rounded-2xl border-t-[3px] bg-white p-4 shadow-[0_14px_30px_-18px_rgba(17,17,19,0.35)] md:p-5">
          
          <p aria-hidden="true" className="mt-auto hidden font-mono text-[3.25rem] leading-none tracking-[-0.03em] text-[#111113] md:block">194<span className="ml-1 text-[1rem] tracking-normal text-[#52525b]">days</span></p>
          <p className="hidden text-[0.8125rem] leading-[1.45] text-[#3f3f46] md:block">The longest-running SUGAR ad, by Google&rsquo;s own days-shown count.</p>
          <a href={SUGAR_LONGEST_AD.url} target="_blank" rel="noreferrer" className={`${chip} w-fit transition-colors hover:bg-black/[0.09]`}>
            <span className="truncate">Google Ads Transparency · fetched {CHECK_DATE}</span>
          </a>
        </li>
        <li style={{ borderTopColor: "var(--hook-product-feature)" }} className="flex flex-col gap-3 rounded-2xl border-t-[3px] bg-white p-4 shadow-[0_14px_30px_-18px_rgba(17,17,19,0.35)] md:p-5">
          <h3 className="font-display text-[1.1875rem] font-medium leading-[1.2] tracking-[-0.02em]">Engagement: not checked in this run</h3>
          <p aria-hidden="true" className="mt-auto hidden font-mono text-[3.25rem] leading-none tracking-[-0.03em] text-[#111113] md:block">&mdash;<span className="ml-2 text-[1rem] tracking-normal text-[#52525b]">no value</span></p>
          <p className="hidden text-[0.8125rem] leading-[1.45] text-[#3f3f46] md:block">Drishti names the gap instead of filling it with a number.</p>
          <span className={`${chip} w-fit`}><span className="truncate">Source status: not checked, never shown as zero</span></span>
        </li>
        <li style={{ borderTopColor: "var(--hook-founder-story)" }} className="flex flex-col gap-3 rounded-2xl border-t-[3px] bg-white p-4 shadow-[0_14px_30px_-18px_rgba(17,17,19,0.35)] md:p-5">
          <p className="border-l-2 pl-3 font-display text-[1.1875rem] font-medium leading-[1.25] tracking-[-0.02em]" style={{ borderColor: "var(--hook-founder-story)" }}>
            {SUGAR.counts.education_explainer} of {SUGAR.total} tagged SUGAR findings open with an explainer hook 
          </p>
          <p aria-hidden="true" className="mt-auto hidden font-mono text-[3.25rem] leading-none tracking-[-0.03em] text-[#111113] md:block">16<span className="text-[#a1a1aa]">/40</span></p>
          <p className="hidden text-[0.8125rem] leading-[1.45] text-[#3f3f46] md:block">If a sentence cites nothing, it does not ship.</p>
          <span className={`${chip} w-fit`}><span className="truncate">[1] Latest check</span></span>
        </li>
      </ul>
    </div>
  );
}

function StackedCompare() {
  return (
    <div className="grid gap-3 md:hidden">
      <div className="relative overflow-hidden rounded-2xl border border-white/15 opacity-60">
        
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/15"><DrishtiLayer /></div>
    </div>
  );
}
