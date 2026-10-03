import { cn } from "@/lib/utils";

const FILL = { fg: "bg-fg", warn: "bg-warn", danger: "bg-danger" } as const;

type MeterProps = {
  value: number;
  max: number;
  fill?: keyof typeof FILL;
  className?: string;
  "aria-label": string;
};

export function Meter({ value, max, fill = "fg", className, "aria-label": label }: MeterProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <span
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn("relative inline-block h-1 w-10 shrink-0 overflow-hidden rounded-full bg-bg-inset", className)}
    >
      <span className={cn("absolute inset-y-0 left-0 rounded-full", FILL[fill])} style={{ width: `${pct}%` }} />
    </span>
  );
}
