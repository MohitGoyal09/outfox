"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { useIsMd } from "./motion-utils";

const START_TILT_DEG = 14;

export function ContainerScroll({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const isMd = useIsMd();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [START_TILT_DEG, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const animated = isMd && !reduce;

  return (
    <div ref={ref} className={cn("[perspective:1200px]", className)}>
      <motion.div style={animated ? { rotateX, scale, y, transformOrigin: "50% 0%" } : undefined} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
