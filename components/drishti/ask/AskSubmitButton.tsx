"use client";


import type { ChatStatus } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useReducedMotion } from "@/components/aceternity/motion-utils";

export function AskSubmitButton({
  status,
  canSend,
  onSend,
  onStop,
  size = 40,
  className,
}: {
  status: ChatStatus;
  canSend: boolean;
  onSend: () => void;
  onStop: () => void;
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const generating = status === "submitted" || status === "streaming";
  const kind = status === "submitted" ? "spinner" : status === "streaming" ? "stop" : "send";
  const active = generating || canSend;
  const label = generating ? "Stop generating" : canSend ? "Send" : "Type a question";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={generating ? "Stop" : "Send"}
          aria-disabled={!active}
          onClick={() => {
            if (generating) onStop();
            else if (canSend) onSend();
          }}
          style={{ width: size, height: size }}
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full",
            "motion-safe:transition-colors motion-safe:duration-150",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            active
              ? "cursor-pointer bg-accent text-accent-ink hover:bg-accent-strong"
              : "cursor-not-allowed bg-bg-inset text-fg-tertiary",
            className,
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={kind}
              className="flex"
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduce ? undefined : { scale: 0.6, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.12 }}
            >
              {kind === "spinner" ? (
                <Spinner className="size-4" />
              ) : kind === "stop" ? (
                <Square className="size-3.5 fill-current" aria-hidden="true" />
              ) : (
                <ArrowUp className="size-5" strokeWidth={2.25} aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
