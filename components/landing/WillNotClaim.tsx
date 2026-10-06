"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { ChevronsLeftRight, Link2Off, ScanSearch, ShieldOff } from "lucide-react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { HOOK_MATRIX, SUGAR_LONGEST_AD } from "./landing-data";

const SUGAR = HOOK_MATRIX[0];
const END = 50;
const STEP = 5;

type Slot = { label: string; value: string; text: React.ReactNode; chip: string; href?: string; accent?: string };

function StackedCompare() {
  return (
    <div className="grid gap-3 md:hidden">
      
      
    </div>
  );
}

export function WillNotClaim() {
  return (
    <section id="limits" aria-labelledby="limits-heading" className="l-ink scroll-mt-20 overflow-hidden bg-[var(--ink-base)] text-fg">
      <div className="l-wrap relative py-16 lg:py-20">
        
        
        
      </div>
    </section>
  );
}
