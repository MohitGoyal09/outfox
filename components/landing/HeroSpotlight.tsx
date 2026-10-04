"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { usePointerFine } from "@/components/aceternity/motion-utils";
import { DotGrid } from "./DotGrid";

export function HeroSpotlight({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const fine = usePointerFine();
  const reduce = useReducedMotion();
  const inView = useInView(wrap);
  const active = fine && !reduce && inView;

  useEffect(() => {
    const w = wrap.current;
    let tx = 0;
    let raf = 0;
    let seen = false;
    const step = () => {
      place();
      raf = Math.hypot(tx - x, ty - y) > 0.5 ? requestAnimationFrame(step) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX - r.left;
      s.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(step);
    };
    const leave = () => {
      s.style.opacity = "0";
    };
    w.addEventListener("pointermove", move);
    w.addEventListener("pointerleave", leave);
  }, [active]);

  return (
    <div ref={wrap} className="relative isolate">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <DotGrid id="l-hero-grid" className="absolute inset-0 size-full opacity-70 [mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_80%,transparent)]" />
        <div
          ref={spot}
          className="absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            maskImage: MASK,
            WebkitMaskImage: MASK,
            maskSize: `${R * 2}px ${R * 2}px`,
            WebkitMaskSize: `${R * 2}px ${R * 2}px`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "-9999px -9999px",
            WebkitMaskPosition: "-9999px -9999px",
          }}
        >
          <DotGrid id="l-hero-grid-spot" color="var(--text-secondary)" className="absolute inset-0 size-full" />
        </div>
      </div>
      {children}
    </div>
  );
}
