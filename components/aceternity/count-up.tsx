"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { EASE_OUT } from "./motion-utils";

const format = (n: number) => Math.round(n).toLocaleString("en-US");

export function CountUp({ value, prefix = "", className }: { value: number; prefix?: string; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    const el = ref.current;
    if (!inView || reduce || !el) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = `${prefix}${format(v)}`;
      },
      onComplete: () => {
        el.textContent = `${prefix}${format(value)}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, prefix]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${format(value)}`}
    </span>
  );
}
