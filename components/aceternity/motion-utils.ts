"use client";

import { useSyncExternalStore } from "react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_SNAP = [0.4, 0, 0.2, 1] as const;

function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function usePointerFine(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

export function useIsMd(): boolean {
  return useMediaQuery("(min-width: 768px)");
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
