"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { EASE_OUT, useReducedMotion } from "./motion-utils";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
