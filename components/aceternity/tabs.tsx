"use client";

import { useId, createContext, useContext, type ReactNode } from "react";
import { motion } from "motion/react";
import { EASE_OUT, useReducedMotion } from "./motion-utils";

const GroupId = createContext<string>("tabs");

export function TabPillGroup({ children }: { children: ReactNode }) {
  const id = useId();
  return <GroupId.Provider value={id}>{children}</GroupId.Provider>;
}

export function TabPill({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const id = useContext(GroupId);
  return (
    <motion.span
      layoutId={`tab-pill-${id}`}
      aria-hidden="true"
      className={className}
      transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
    />
  );
}
