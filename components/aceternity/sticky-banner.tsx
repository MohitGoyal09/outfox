"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "./motion-utils";

const STORAGE_KEY = "drishti.landing.banner.dismissed";

const listeners = new Set<() => void>();

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
  }
}

let dismissedInMemory = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getDismissed = () => dismissedInMemory || readDismissed();

export function StickyBanner({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const open = !useSyncExternalStore(subscribe, getDismissed, () => false);

  function dismiss() {
    dismissedInMemory = true;
    writeDismissed();
    listeners.forEach((l) => l());
  }

  return (
    <motion.div
      initial={false}
      animate={{ height: open ? 36 : 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE_OUT }}
      className={cn("relative z-50 overflow-hidden bg-accent text-accent-ink", className)}
      aria-hidden={open ? undefined : true}
      inert={open ? undefined : true}
    >
      <div className="flex h-9 items-center justify-center px-12 text-center text-[13px] leading-none">{children}</div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-accent-ink/80 transition-colors duration-150 hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </motion.div>
  );
}
