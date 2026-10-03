"use client";

import { Background, BackgroundVariant, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function CanvasChrome() {
  return (
    <>
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="var(--border-strong)" />
      <Controls showInteractive={false} position="bottom-left" aria-label="Canvas zoom controls" />
      <MiniMap
        pannable
        zoomable
        ariaLabel="Board overview"
        className="!hidden lg:!block !rounded-md !border !border-border !bg-bg-raised !shadow-sm"
        maskColor="rgba(21, 23, 27, 0.06)"
        nodeColor="var(--border-strong)"
        position="bottom-right"
      />
    </>
  );
}
