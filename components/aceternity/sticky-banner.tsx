"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT, useReducedMotion } from "./motion-utils";

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
  const [tween, setTween] = useState(false);
  const open = !useSyncExternalStore(subscribe, getDismissed, () => false);

  function dismiss() {
    setTween(true);
    dismissedInMemory = true;
    writeDismissed();
    listeners.forEach((l) => l());
  }

  return (
    <motion.div
      initial={false}
      animate={{ height: open ? 36 : 0 }}
      transition={reduce || !tween ? { duration: 0 } : { duration: 0.24, ease: EASE_OUT }}
      className={cn("relative z-50 overflow-hidden border-b border-border bg-bg text-fg-secondary", className)}
      aria-hidden={open ? undefined : true}
      inert={open ? undefined : true}
    >
      <div className="flex h-9 items-center justify-center gap-2 px-12 text-center text-[13px] leading-none"><span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--mark)]" />{children}</div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-0 top-0 flex h-9 w-11 items-center justify-center rounded-sm text-fg-secondary transition-colors duration-150 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </motion.div>
  );
}
