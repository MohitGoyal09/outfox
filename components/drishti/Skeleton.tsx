
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SkeletonVariant =
  | "text"
  | "block"
  | "row"
  | "stat"
  | "bar"
  | "circle"
  | "pill";

type SkeletonShape = {
  height: number;
  radiusClass: string;
  defaultLines: number;
  fullWidth: boolean;
};

export const SKELETON_SHAPE: Record<SkeletonVariant, SkeletonShape> = {
  text: {
    height: 12,
    radiusClass: "rounded-full",
    defaultLines: 1,
    fullWidth: true,
  },
  block: {
    height: 64,
    radiusClass: "rounded-lg",
    defaultLines: 1,
    fullWidth: true,
  },
  row: {
    height: 44,
    radiusClass: "rounded-md",
    defaultLines: 1,
    fullWidth: true,
  },
  stat: {
    height: 34,
    radiusClass: "rounded-sm",
    defaultLines: 1,
    fullWidth: false,
  },
  bar: {
    height: 6,
    radiusClass: "rounded-full",
    defaultLines: 1,
    fullWidth: true,
  },
  circle: {
    height: 6,
    radiusClass: "rounded-full",
    defaultLines: 1,
    fullWidth: false,
  },
  pill: {
    height: 28,
    radiusClass: "rounded-full",
    defaultLines: 1,
    fullWidth: false,
  },
};

export type SkeletonProps = {
  variant?: SkeletonVariant;
  lines?: number;
  width?: number | string;
  height?: number;
  className?: string;
};

export function skeletonShape(
  variant: SkeletonVariant,
  overrides?: { height?: number; width?: number | string; lines?: number },
): { height: number; width: string; lines: number; radiusClass: string } {
  const shape = SKELETON_SHAPE[variant];
  const height = overrides?.height ?? shape.height;
  const width =
    typeof overrides?.width === "number"
      ? `${overrides.width}px`
      : (overrides?.width ?? (shape.fullWidth ? "100%" : `${height}px`));
  const lines =
    variant === "text" ? Math.max(1, overrides?.lines ?? shape.defaultLines) : 1;
  return { height, width, lines, radiusClass: shape.radiusClass };
}

export function Skeleton({
  variant = "text",
  lines,
  width,
  height,
  className,
}: SkeletonProps) {
  const shape = skeletonShape(variant, { lines, width, height });
  const bars = Array.from({ length: shape.lines }, (_, index) => {
    const isLastOfMany = shape.lines > 1 && index === shape.lines - 1;
    return (
      <span
        key={index}
        aria-hidden="true"
        className={cn(
          "block bg-bg-inset motion-safe:animate-pulse motion-safe:[animation-duration:1.4s]",
          shape.radiusClass,
          shape.lines === 1 && className,
        )}
        style={{
          height: `${shape.height}px`,
          width: isLastOfMany ? "72%" : shape.width,
        }}
      />
    );
  });
  if (shape.lines === 1) return bars[0];
  return (
    <span className={cn("flex w-full flex-col gap-2", className)}>{bars}</span>
  );
}

export function SkeletonRegion({
  children,
  label = "Loading",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonRows({
  count,
  variant = "row",
  height,
  className,
}: {
  count: number;
  variant?: SkeletonVariant;
  height?: number;
  className?: string;
}) {
  return (
    <SkeletonRegion
      label="Loading rows"
      className={cn("flex flex-col gap-2", className)}
    >
      {Array.from({ length: Math.max(0, count) }, (_, index) => (
        <Skeleton key={index} variant={variant} height={height} />
      ))}
    </SkeletonRegion>
  );
}
