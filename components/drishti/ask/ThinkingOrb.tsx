"use client";


import dynamic from "next/dynamic";
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { OrbErrorBoundary } from "./OrbErrorBoundary";

const Orb19 = dynamic(() => import("@/components/orbs/orb-19"), { ssr: false });

const HALFTONE = {
  backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1.2px)",
  backgroundSize: "5px 5px",
} as const;

export function ThinkingOrb({
  size,
  state,
  className = "",
  label,
}: {
  size: number;
  state: "idle" | "thinking";
  className?: string;
  label?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [hasGpu] = useState(() => typeof navigator !== "undefined" && "gpu" in navigator);
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <span className="absolute inset-0 rounded-full bg-accent" style={HALFTONE} />
      {hasGpu ? (
        <span className="absolute inset-0">
          <OrbErrorBoundary>
          <Orb19
            size={size}
            state={state}
            paused={Boolean(reduceMotion)}
            maxDpr={size < 64 ? 1 : undefined}
            ariaLabel={label}
          />
          </OrbErrorBoundary>
        </span>
      ) : null}
    </span>
  );
}
