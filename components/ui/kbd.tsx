import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 rounded-[5px] border border-border bg-bg-inset px-1 font-mono text-[11px] font-medium text-fg-secondary shadow-[inset_0_-1px_0_rgba(16,24,40,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

export { Kbd, KbdGroup };
