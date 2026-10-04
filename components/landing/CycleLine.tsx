"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";

const ITEMS = [
  "new ads",
  "hook shifts",
  "long-running creatives",
  "price offers",
  "YouTube launches",
  "press mentions",
] as const;
const CYCLE_MS = 2400;

export function CycleLine({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const probe = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const measure = () => setWidths(Array.from(probe.current?.children ?? [], (c) => (c as HTMLElement).offsetWidth));
    measure();
    document.fonts?.ready.then(measure);
  }, []);

  useEffect(() => {
    if (reduce) return;
    return () => window.clearInterval(t);
  }, [reduce]);

  const cur = ITEMS[reduce ? 0 : i];
  const width = widths?.[reduce ? 0 : i];
}
