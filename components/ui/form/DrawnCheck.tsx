"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/components/aceternity/motion-utils";

export function DrawnCheck({ className = "size-4", strokeWidth = 2.5 }: { className?: string; strokeWidth?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
