"use client";

import type { ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "./motion-utils";

export type ButtonStatus = "idle" | "pending" | "success";

export function StatefulButton({
  status,
  className,
  idleLabel,
  pendingLabel,
  successLabel,
  ...props
}: { status: ButtonStatus; idleLabel: string; pendingLabel: string; successLabel: string } & Omit<ComponentProps<typeof Button>, "children" | "disabled">) {
  const reduce = useReducedMotion();
  const swap = reduce ? { duration: 0 } : { duration: 0.18, ease: EASE_OUT };
  const label = status === "pending" ? pendingLabel : status === "success" ? successLabel : idleLabel;
  return (
    <>
      <Button {...props} disabled={status !== "idle"} aria-busy={status === "pending"} className={cn("min-w-40 disabled:opacity-100", className)}>
        <AnimatePresence initial={false} mode="popLayout">
          {status !== "idle" ? (
            <motion.span
              key={status}
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={swap}
              className="flex"
            >
              {status === "pending" ? <LoaderCircle className={reduce ? "size-4" : "size-4 animate-spin"} /> : <Check className="size-4" />}
            </motion.span>
          ) : null}
        </AnimatePresence>
        <span>{label}</span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : label}
      </span>
    </>
  );
}
