"use client";

import { useState } from "react";
import Image from "next/image";
import { hookName } from "@/components/drishti/labels";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { HOOK_COLOR, isHookType } from "@/components/drishti/tokens";
import { CardContainer, CardItem } from "@/components/aceternity/3d-card";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { AD_CREATIVE, ASK, CHECK_DATE, HOOK_MATRIX, HOOK_ORDER, OFF_TOPIC, TRENDS } from "./landing-data";

export function HookTable() {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-raised">
      
    </div>
  );
}

const chipClass = "num mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-[5px] border border-border bg-bg-inset px-1 align-[0.1em] text-[10px] text-fg-secondary";

function Chips({ cites }: { cites: readonly number[] }) {
  return (
    <>
      {cites.map((n) => (
        <span key={n} className={chipClass}>
          {n}
        </span>
      ))}
    </>
  );
}

function AskAnswer() {
  return (
    <div className="flex flex-col gap-4">
      <p className="ml-auto max-w-[85%] rounded-[14px] bg-accent px-3.5 py-2 text-[13px] leading-[1.4] text-accent-ink">{ASK.question}</p>
      <div className="text-[13px] leading-[1.6] text-fg">
        <p>{ASK.lead}</p>
        
      </div>
    </div>
  );
}

export function OffTopic() {
  const [showing, setShowing] = useState(true);
  const o = OFF_TOPIC;
}

const PLOT = { w: 360, h: 150, left: 6, right: 96, top: 10, bottom: 8 };

function TrendsLines() {
  const innerW = PLOT.w - PLOT.left - PLOT.right;
  const style = [
    { stroke: "var(--text-primary)", width: 1.75, dash: undefined },
    { stroke: "var(--text-secondary)", width: 1.5, dash: undefined },
    { stroke: "var(--text-tertiary)", width: 1.25, dash: "3 3" },
  ];
  return (
    <figure>
      <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} role="img" aria-label={`Google Trends interest, 0 to 100, ${TRENDS.from} to ${TRENDS.to}. Latest: ${label}.`} className="h-auto w-full">
        {[0, 50, 100].map((g) => {
          const y = PLOT.top + innerH * (1 - g / 100);
          return (
            <g key={g}>
              
              <text x={PLOT.left + innerW + 6} y={y + 3} className="num" fontSize="9" fill="var(--text-tertiary)">
                {g === 0 ? "0" : g === 100 ? "100" : "50"}
              </text>
            </g>
          );
        })}
        
        {TRENDS.series.map((s, i) => {
          const v = s.values[s.values.length - 1];
        })}
      </svg>
      <figcaption className="num mt-1 flex justify-between pr-[26%] text-[10px] text-fg-tertiary">
        <span>{TRENDS.from}</span>
        
      </figcaption>
    </figure>
  );
}
