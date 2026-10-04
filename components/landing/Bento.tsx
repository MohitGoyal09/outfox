"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { hookName } from "@/components/drishti/labels";
import { HOOK_COLOR, isHookType } from "@/components/drishti/tokens";
import { EngineTag, PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { CardContainer, CardItem } from "@/components/aceternity/3d-card";
import { CountUp } from "@/components/aceternity/count-up";
import { cn } from "@/lib/utils";
import { HookCell } from "./HookCell";
import { AD_CREATIVE, HERO_FINDINGS, HOOK_MATRIX, HOOK_ORDER, NUMBERS, OFF_TOPIC, SOURCES } from "./landing-data";

export function HookTable() {
  const body = useRef<HTMLTableSectionElement>(null);
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-raised">
      
    </div>
  );
}

export function OffTopic() {
  const [showing, setShowing] = useState(true);
  const o = OFF_TOPIC;
}

const tint = (hue: string, pct = 12) => `color-mix(in oklab, ${hue} ${pct}%, var(--bg-raised))`;

function Tile({ title, line, hue, className, children }: { title: string; line: string; hue?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col rounded-[24px] border border-border p-6 lg:p-7", className)} style={{ backgroundColor: hue ? tint(hue) : "var(--bg-raised)" }}>
      <h4 className="l-h3 text-[1.25rem] text-fg">{title}</h4>
      <p className="mt-1.5 max-w-[46ch] text-[0.9375rem] leading-[1.5] text-fg-secondary">{line}</p>
      <div className="mt-5 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

const toNumber = (s: string) => Number(s.replace(/,/g, ""));
const FRESH = [HERO_FINDINGS[0].evidence[0], HERO_FINDINGS[0].evidence[2]];
