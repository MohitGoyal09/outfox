"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export type TimelineEntry = { key: string; marker: ReactNode; content: ReactNode };

export function Timeline({ entries, className }: { entries: readonly TimelineEntry[]; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 60%"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <ol ref={ref} className={cn("relative m-0 list-none p-0", className)}>
      <span aria-hidden="true" className="absolute bottom-0 left-5 top-0 w-px bg-border-strong" />
      <motion.span
        aria-hidden="true"
        className="absolute bottom-0 left-5 top-0 -ml-px w-[3px] origin-top rounded-full bg-fg"
        style={{ scaleY: reduce ? 1 : fill }}
      />
      {entries.map((e) => (
        <li key={e.key} className="relative pb-16 pl-16 last:pb-0 md:pl-20">
          <span className="absolute left-0 top-0 z-10 flex size-10 items-center justify-center rounded-full border border-border-strong bg-bg-raised shadow-xs">{e.marker}</span>
          {e.content}
        </li>
      ))}
    </ol>
  );
}
