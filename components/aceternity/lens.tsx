"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, usePointerFine } from "./motion-utils";

export function Lens({ children, zoom = 1.7, size = 168, className }: { children: ReactNode; zoom?: number; size?: number; className?: string }) {
  const fine = usePointerFine();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const enabled = fine && !reduce;
  const r = size / 2;

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <div
      className={cn("relative cursor-zoom-in overflow-hidden", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        setPt({ x: e.clientX - b.left, y: e.clientY - b.top });
      }}
    >
      {children}
      <AnimatePresence>
        {hover ? (
          <motion.div
            aria-hidden="true"
            inert
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            style={{ clipPath: `circle(${r}px at ${pt.x}px ${pt.y}px)` }}
          >
            <div className="absolute inset-0 bg-bg-raised" />
            <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: `${pt.x}px ${pt.y}px` }}>
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {hover ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full border border-border-strong shadow-md"
          style={{ width: size, height: size, left: pt.x - r, top: pt.y - r }}
        />
      ) : null}
    </div>
  );
}
