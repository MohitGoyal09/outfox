"use client";


import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
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
  tint?: boolean;
  padded?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function isNestedPanel(depth: number): boolean {
  return depth > 0;
}

const PanelDepthContext = createContext(0);

function PanelRoot({
  children,
  as = "div",
  interactive = false,
  inset = false,
  tint = false,
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
        "rounded-lg border border-border shadow-xs",
        inset || tint ? "bg-bg-inset" : "bg-bg-raised",
        interactive &&
          cn(
            "hover:border-border-strong focus-within:border-border-strong",
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

export type PanelHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

function PanelHeader({ title, description, trailing, className }: PanelHeaderProps) {
  return (
    <div className={cn("border-b border-border px-5 py-4", className)}>
      <SectionHeader title={title} sub={description} trailing={trailing} />
    </div>
  );
}

function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export const Panel = Object.assign(PanelRoot, { Header: PanelHeader, Body: PanelBody });
