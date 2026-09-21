"use client";


import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { STATE_TRANSITION_CLASS } from "./tokens";

export type PanelTag =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "li";

export type PanelProps = {
  children: ReactNode;
  as?: PanelTag;
  interactive?: boolean;
  inset?: boolean;
  padded?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function isNestedPanel(depth: number): boolean {
  return depth > 0;
}

const PanelDepthContext = createContext(0);

export function Panel({
  children,
  as = "div",
  interactive = true,
  inset = false,
  padded = false,
  className,
  ariaLabel,
}: PanelProps) {
  const depth = useContext(PanelDepthContext);
  const Element = as;

  useEffect(() => {
    if (isNestedPanel(depth) && process.env.NODE_ENV !== "production") {
      console.error(
        "Panel must not be nested inside another Panel. Use a divider or a plain section instead.",
      );
    }
  }, [depth]);

  return (
    <Element
      aria-label={ariaLabel}
      role={ariaLabel ? "group" : undefined}
      className={cn(
        "rounded-[10px] border border-[var(--border,#24242f)]",
        inset ? "bg-[var(--bg-inset,#0e0e13)]" : "bg-[var(--bg-raised,#131319)]",
        interactive &&
          cn(
            "hover:border-[var(--border-strong,#35353f)] hover:bg-[var(--bg-raised-2,#191922)] focus-within:border-[var(--border-strong,#35353f)]",
            STATE_TRANSITION_CLASS,
          ),
        padded && "p-4",
        className,
      )}
    >
      <PanelDepthContext.Provider value={depth + 1}>
        {children}
      </PanelDepthContext.Provider>
    </Element>
  );
}
