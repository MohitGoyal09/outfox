"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/aceternity/motion-utils";
const LOOP_S = 5;

export function BorderBeam({ radius }: { radius: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
  }, []);

  const rect = size ? { x: 0.5, y: 0.5, width: size.w - 1, height: size.h - 1, rx: radius - 0.5, pathLength: 100, fill: "none" } : null;
  const show = reduce ? "opacity-0 group-focus-within:opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100";

  return (
    <svg ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full overflow-visible transition-opacity duration-200 ${show}`}>
      {rect && reduce ? <rect {...rect} stroke={INK} strokeOpacity={0.6} strokeWidth={1.5} /> : null}
      
    </svg>
  );
}
