"use client";

import type { ReactNode } from "react";
import type { YAxisTickContentProps } from "recharts";

export function categoryLabel(value: unknown, maxChars: number): string {
  const text = String(value ?? "").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}\u2026`;
}

export function wrapLabel(value: unknown, charsPerLine: number, maxLines = 2): string[] {
  const words = String(value ?? "").trim().split(/\s+/).filter((word) => word !== "");
  const lines: string[] = [];
  let current = "";
  let index = 0;
  for (; index < words.length; index += 1) {
    const word = words[index];
    const next = current === "" ? word : `${current} ${word}`;
    if (next.length <= charsPerLine || current === "") {
      current = next;
      continue;
    }
    if (lines.length === maxLines - 1) break;
    lines.push(current);
    current = word;
  }
  if (current !== "") lines.push(index < words.length ? `${current} ${words.slice(index).join(" ")}` : current);
  return lines.map((line, i) => (i === lines.length - 1 ? categoryLabel(line, charsPerLine) : line));
}

const LINE_HEIGHT = 12;

export function CategoryAxisTick(charsPerLine: number, maxLines = 2) {
  return function Tick({ x, y, width, payload, className }: YAxisTickContentProps): ReactNode {
    const tickX = typeof x === "number" ? x : Number(x);
    const bandWidth = typeof width === "number" ? width : Number(width ?? 0);
    const tickY = typeof y === "number" ? y : Number(y);
    const lines = wrapLabel(payload?.value, charsPerLine, maxLines);
    const firstDy = -((lines.length - 1) * LINE_HEIGHT) / 2;
    return (
      <text
        className={className}
        x={tickX - bandWidth + 2}
        y={tickY}
        textAnchor="start"
        fill="var(--text-secondary)"
        fontFamily="var(--font-sans)"
        fontSize={11}
      >
        <title>{String(payload?.value ?? "")}</title>
        {lines.map((line, i) => (
          <tspan key={i} x={tickX - bandWidth + 2} dy={i === 0 ? `${firstDy + 4}px` : `${LINE_HEIGHT}px`}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };
}
