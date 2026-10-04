"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { hookName } from "@/components/drishti/labels";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { HOOK_COLOR, isHookType } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";
import { AD_CREATIVE, ASK, CHECK_DATE, HOOK_MATRIX, HOOK_ORDER, OFF_TOPIC, TRENDS } from "./landing-data";

function HookTable() {
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

function AdCard() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-bg-raised shadow-xs">
      <img
        src={a.image}
        alt="SUGAR Cosmetics ad creative: Beauty Favourites at 249 rupees"
        width={a.width}
        height={a.height}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="aspect-[5/4] w-full border-b border-border object-cover object-[50%_43%]"
      />
      
    </div>
  );
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

export function Bento() {
  return (
    <section aria-labelledby="bento-heading" className="border-t border-border bg-bg-raised">
      <div className="l-wrap py-20 lg:py-28">
        <h2 id="bento-heading" className="l-h2 max-w-[22ch] text-fg">
          What you can see that a search tab does not show you.
        </h2>
        <p className="num mt-4 text-xs text-fg-tertiary">Every visual below is real data from the check of .</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          <Tile
            id="tile-hooks"
            title="Hook mix by brand"
            caption="Each brand's share of tagged findings per hook. The colour names the hook; the depth is the share."
            className="md:col-span-2 lg:col-span-8"
          >
            <HookTable />
          </Tile>
          <Tile
            id="tile-ask"
            title="Answers you can check"
            caption="Every sentence cites a stored finding. Anything untraceable is cut."
            className="md:col-span-2 lg:col-span-4"
          >
            <AskAnswer />
          </Tile>
          <Tile
            id="tile-ads"
            title="Ads, with how long they ran"
            caption="From Google Ads Transparency: the creative, its format and how many days it has run."
            className="lg:col-span-4"
          >
            <AdCard />
          </Tile>
          <Tile
            id="tile-trends"
            title="Demand over time"
            caption="Google Trends interest for each brand, compared only within the group it was fetched with."
            className="lg:col-span-4"
          >
            <TrendsLines />
          </Tile>
          
          <Tile
            id="tile-boards"
            title="Boards"
            caption="Save evidence while you browse. Every card keeps its source."
            className="md:col-span-2 lg:col-span-12"
          >
            <div className="h-56 overflow-hidden rounded-[10px] border border-border bg-bg-raised sm:h-64 lg:h-72">
              <Image src="/landing/board.webp" alt="A board of saved evidence cards in four columns." width={1440} height={770} sizes="(min-width: 1280px) 1120px, 100vw" className="h-full w-full object-cover object-left-top" />
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}
