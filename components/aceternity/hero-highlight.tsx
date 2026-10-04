import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("l-mark", className)}>{children}</span>;
}
