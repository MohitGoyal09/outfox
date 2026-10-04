"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { usePointerFine, useReducedMotion } from "./motion-utils";

export function MagneticButton({ children, strength = 0.25, maxDistance = 8 }: { children: ReactNode; strength?: number; maxDistance?: number }) {
  const reduce = useReducedMotion();
  const fine = usePointerFine();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  if (reduce || !fine) return <div className="inline-flex">{children}</div>;

  return (
    <div
      className="-m-3 inline-flex p-3"
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        let x = (e.clientX - (r.left + r.width / 2)) * strength;
        let y = (e.clientY - (r.top + r.height / 2)) * strength;
        const d = Math.hypot(x, y);
        if (d > maxDistance) {
          x *= maxDistance / d;
          y *= maxDistance / d;
        }
        setPos({ x, y });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
    >
      <motion.div ref={ref} animate={pos} transition={{ type: "spring", stiffness: 220, damping: 22, mass: 0.2 }} className="inline-flex">
        {children}
      </motion.div>
    </div>
  );
}
