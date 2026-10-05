"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { hookName } from "@/components/drishti/labels";
import { HOOK_COLOR, isHookType } from "@/components/drishti/tokens";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { CardContainer, CardItem } from "@/components/aceternity/3d-card";
import { CountUp } from "@/components/aceternity/count-up";
import { cn } from "@/lib/utils";
import { HookCell } from "./HookCell";
import { AD_CREATIVE, HERO_FINDINGS, HOOK_MATRIX, HOOK_ORDER, NUMBERS, OFF_TOPIC } from "./landing-data";

export function HookTable() {
  const body = useRef<HTMLTableSectionElement>(null);
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-raised">
      <table className="w-full min-w-[34rem] border-collapse text-[12px]" aria-label="Hook mix by brand">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pl-3 pr-2 text-left align-bottom text-[11px] font-medium text-fg-tertiary">
              Brand
            </th>
            {HOOK_ORDER.map((h) => (
              <th key={h} scope="col" className="px-1.5 py-2 text-right align-bottom text-[11px] font-medium leading-[1.2] text-fg-tertiary">
                
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={body}>
          {HOOK_MATRIX.map((row, r) => (
            <tr key={row.name} className="border-b border-border last:border-b-0">
              
              {HOOK_ORDER.map((h, c) => {
                const count = row.counts[h];
                const share = Math.round((count / row.total) * 100);
                const pos = `${r}-${c}`;
                return (
                  <HookCell
                    key={h}
                    brand={row.name}
                    hook={h}
                    count={count}
                    total={row.total}
                    share={share}
                    fill={shade(share, h)}
                    pos={pos}
                    tabbable={cur === pos}
                    onFocusCell={() => setCur(pos)}
                    onKeyDown={(e) => move(r, c, e)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdCard() {
  return (
    <CardContainer className="flex flex-col rounded-[14px] border border-border bg-bg-raised shadow-xs" containerClassName="flex-1">
      <div className="relative aspect-[600/885] w-full overflow-hidden rounded-t-[13px] border-b border-border bg-white">
        <img
          src={a.image}
          alt="SUGAR Cosmetics ad creative: Beauty Favourites at 249 rupees"
          width={a.width}
          height={a.height}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <CardItem translateZ={18} className="flex flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <EngineTag engine="google_ads_transparency_center" />
          
        </div>
        <p className="text-[13px] text-fg-secondary">
          {a.brand}. Ran for <span className="num font-medium text-fg">{a.totalDaysShown}</span> days
        </p>
      </CardItem>
    </CardContainer>
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
