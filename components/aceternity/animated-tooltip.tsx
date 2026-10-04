"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "./motion-utils";

const EDGE_GAP = 8;
const TIP_HALF = 112; // half of the 14rem tooltip width

export function AnimatedTooltip({ content, children, className }: { content: string; children: ReactNode; className?: string }) {
  const id = useId();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);

  function show() {
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      const cx = r.left + r.width / 2;
      const vw = document.documentElement.clientWidth;
      const left = Math.max(0, EDGE_GAP + TIP_HALF - cx);
      const right = Math.max(0, cx + TIP_HALF - (vw - EDGE_GAP));
      setShift(left - right);
    }
    setOpen(true);
  }

  return (
    <span className="relative inline-flex">
      <button
        ref={ref}
        type="button"
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={cn(
          "group inline-flex items-center gap-2.5 rounded-sm text-[0.9375rem] font-medium text-fg-secondary transition-colors duration-150 hover:text-fg focus-visible:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          className,
        )}
      >
        {children}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.span
            id={id}
            role="tooltip"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            style={{ x: shift }}
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2.5 -ml-28 block w-56 rounded-[10px] bg-accent px-3 py-2 text-center text-[12.5px] leading-[1.4] text-accent-ink shadow-md"
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
