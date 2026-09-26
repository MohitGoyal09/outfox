"use client";

import type { ReactNode } from "react";
import type { YAxisTickContentProps } from "recharts";

export function categoryLabel(value: unknown, maxChars: number): string {
  const text = String(value ?? "").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}\u2026`;
}

export function CategoryAxisTick(maxChars: number) {
  return function Tick({ x, y, width, payload, className }: YAxisTickContentProps): ReactNode {
    const tickX = typeof x === "number" ? x : Number(x);
    const bandWidth = typeof width === "number" ? width : Number(width ?? 0);
    const tickY = typeof y === "number" ? y : Number(y);
    return (
      <text
        className={className}
        x={tickX - bandWidth + 2}
        y={tickY}
        dy="0.32em"
        textAnchor="start"
        fill="var(--text-secondary)"
        fontFamily="var(--font-mono)"
        fontSize={10}
      >
        {categoryLabel(payload?.value, maxChars)}
      </text>
    );
  };
}
