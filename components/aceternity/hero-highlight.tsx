"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "./motion-utils";

export function Highlight({ children, className, delay = 0.45 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className={cn("relative inline-block whitespace-nowrap", className)}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.14em] left-0 h-[0.2em] w-full overflow-visible"
      >
        <motion.path
          d="M1 5.2 C 18 2.2, 36 6.6, 54 4 S 88 3.2, 99 4.6"
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="2.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduce ? { duration: 0 } : { duration: 0.8, ease: EASE_OUT, delay }}
        />
      </svg>
    </span>
  );
}
