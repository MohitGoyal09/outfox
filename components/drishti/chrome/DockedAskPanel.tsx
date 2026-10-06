"use client";


import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NEAR_BOTTOM_PX = 80;

const ICON_BUTTON =
  "flex size-6 items-center justify-center rounded-full text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function DockedAskPanel({
  chatId,
  scrollKey,
  onCollapse,
  onClear,
  children,
}: {
  chatId: string | null;
  scrollKey: unknown;
  onCollapse: () => void;
  onClear: () => void;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const bodyRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const body = bodyRef.current;
    if (body !== null && pinnedRef.current) body.scrollTop = body.scrollHeight;
  }, [scrollKey]);

  return (
    <motion.div
      role="region"
      aria-label="Outfox's answer"
      initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
      className={cn(
        "pointer-events-auto flex max-h-[70vh] min-h-[14rem] w-full flex-col overflow-hidden",
        "rounded-t-3xl border border-b-0 border-border bg-bg-raised shadow-[var(--shadow-lg)]",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="text-xs font-medium text-fg-secondary">Outfox</span>
        <div className="flex items-center gap-1">
          {chatId !== null ? (
            <Link
              href={`/ask?chat=${encodeURIComponent(chatId)}`}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg"
            >
              Open full chat
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear conversation"
            title="Clear conversation"
            className={ICON_BUTTON}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse answer panel"
            title="Collapse"
            className={ICON_BUTTON}
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={bodyRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
        }}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-3"
      >
        {children}
      </div>
    </motion.div>
  );
}
