"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { EASE_OUT, useReducedMotion } from "./motion-utils";

export function AnimatedNumber({ value, suffix = "", className, id }: { value: number; suffix?: string; className?: string; id?: string }) {
  const reduce = useReducedMotion();
  const el = useRef<HTMLSpanElement | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    const node = el.current;
    const from = prev.current;
    prev.current = value;
    if (!node || from === value) return;
    if (reduce) {
      node.textContent = `${value}${suffix}`;
      return;
    }
    const controls = animate(from, value, {
      duration: 0.8,
      ease: EASE_OUT,
      onUpdate: (v) => {
        node.textContent = `${Math.round(v)}${suffix}`;
      },
      onComplete: () => {
        node.textContent = `${value}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [value, suffix, reduce]);

  return (
    <span
      id={id}
      className={className}
      ref={el}
    >
      {`${value}${suffix}`}
    </span>
  );
}
