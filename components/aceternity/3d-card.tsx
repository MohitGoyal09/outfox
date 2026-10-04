"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePointerFine } from "./motion-utils";

const MAX_TILT_DEG = 5;
const HoverContext = createContext(false);

export function CardContainer({ children, className, containerClassName }: { children: ReactNode; className?: string; containerClassName?: string }) {
  const fine = usePointerFine();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const enabled = fine && !reduce;

  if (!enabled) return <div className={cn("h-full", containerClassName)}><div className={className}>{children}</div></div>;

  return (
    <div className={cn("h-full [perspective:900px]", containerClassName)}>
      <div
        ref={ref}
        className={cn("transition-transform duration-200 ease-out [transform-style:preserve-3d]", className)}
        onMouseEnter={() => setHover(true)}
        onMouseMove={(e) => {
          const el = ref.current;
          if (!el) return;
          const b = el.getBoundingClientRect();
          const nx = (e.clientX - b.left) / b.width - 0.5;
          const ny = (e.clientY - b.top) / b.height - 0.5;
          el.style.transform = `rotateY(${(nx * 2 * MAX_TILT_DEG).toFixed(2)}deg) rotateX(${(-ny * 2 * MAX_TILT_DEG).toFixed(2)}deg)`;
        }}
        onMouseLeave={() => {
          setHover(false);
          if (ref.current) ref.current.style.transform = "";
        }}
      >
        <HoverContext.Provider value={hover}>{children}</HoverContext.Provider>
      </div>
    </div>
  );
}

export function CardItem({ children, className, translateZ = 0 }: { children: ReactNode; className?: string; translateZ?: number }) {
  const hover = useContext(HoverContext);
  return (
    <div className={cn("transition-transform duration-200 ease-out", className)} style={{ transform: hover ? `translateZ(${translateZ}px)` : undefined }}>
      {children}
    </div>
  );
}
