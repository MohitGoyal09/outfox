import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MovingBorder({ children, radius = 10, className }: { children: ReactNode; radius?: number; className?: string }) {
  return (
    <span className={cn("l-orbit-host relative inline-flex overflow-hidden bg-accent p-px", className)} style={{ borderRadius: radius }}>
      <span
        aria-hidden="true"
        className="l-orbit pointer-events-none absolute left-0 top-0 h-[3px] w-6 rounded-full bg-[var(--mark)] motion-reduce:hidden"
        style={{ offsetPath: `inset(0 round ${radius}px)` }}
      />
      <span className="relative inline-flex" style={{ borderRadius: radius - 1 }}>
        {children}
      </span>
    </span>
  );
}
