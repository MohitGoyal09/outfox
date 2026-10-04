"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Plate } from "./Plate";

export type Feature = {
  id: string;
  title: string;
  line: string;
  facts: readonly string[];
  tint: string;
  image: string;
  seed: number;
  sr: string;
  ui: ReactNode;
  fitWidth?: number;
  mobileUi?: ReactNode;
};

const CARD_H = 620;
const STEP = CARD_H + GAP;
const TOP = 88;
const STAGGER = 20;

export function StackedFeatures({ features }: { features: readonly Feature[] }) {
  const list = useRef<HTMLOListElement>(null);
  const n = features.length;
  const listH = n * CARD_H + (n - 1) * GAP;
  const { scrollYProgress } = useScroll({ target: list, offset: ["start start", "end start"] });
  return (
    <ol ref={list} className="m-0 flex list-none flex-col gap-6 p-0 lg:block">
      {features.map((f, i) => (
        <FeatureCard key={f.id} f={f} i={i} n={n} listH={listH} progress={scrollYProgress} />
      ))}
    </ol>
  );
}

function FeatureCard({ f, i, n, listH, progress }: { f: Feature; i: number; n: number; listH: number; progress: MotionValue<number> }) {
  const pinned = (j: number) => j * STEP - (TOP + j * STAGGER);
  const from = last ? 0 : (pinned(i + 1) - (CARD_H - STAGGER)) / listH;
  const dim = useTransform(progress, [from, to], [0, depth * DIM]);
  const vars = { "--t": `${TOP + i * STAGGER}px`, "--s": scale, "--d": dim } as unknown as CSSProperties;

  return (
    <motion.li style={vars} className="lg:sticky lg:top-(--t) lg:h-155 lg:origin-top lg:motion-safe:scale-(--s) lg:not-last:mb-10">
      <article
        aria-labelledby={`${f.id}-title`}
        className="relative grid h-full gap-7 rounded-[28px] border border-border p-6 shadow-md sm:p-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10 lg:p-10"
        style={{ backgroundColor: `color-mix(in oklab, ${f.tint} 13%, var(--bg-raised))` }}
      >
        <div className="flex min-w-0 flex-col">
          <span className="num inline-flex size-9 items-center justify-center rounded-full bg-fg text-[0.75rem] text-bg">{`0${i + 1}`}</span>
          
          <p className="mt-4 max-w-[34ch] text-[1.0625rem] leading-[1.5] text-fg">{f.line}</p>
          <ul className="m-0 mt-7 flex list-none flex-col divide-y divide-border border-t border-border p-0 lg:mt-auto">
            {f.facts.map((t) => (
              <li key={t} className="flex items-start gap-3 py-2.5 text-[0.9375rem] leading-[1.4] text-fg-secondary">
                <span aria-hidden="true" className="mt-[0.45em] size-1.5 shrink-0 rounded-full" style={{ backgroundColor: f.tint }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <Plate seed={f.seed} image={f.image} tint={f.tint} className="h-[26rem] rounded-[20px] lg:h-full">
          <p className="sr-only">{f.sr}</p>
          <div className="h-full overflow-hidden px-4 pt-8 sm:px-8 sm:pt-10">{f.mobileUi ? (
            <>
              <div className="sm:hidden">{f.mobileUi}</div>
              <div className="hidden sm:block">{f.fitWidth ? <FitWidth width={f.fitWidth}>{f.ui}</FitWidth> : f.ui}</div>
            </>
          ) : f.fitWidth ? (
            <FitWidth width={f.fitWidth}>{f.ui}</FitWidth>
          ) : (
            f.ui
          )}</div>
        </Plate>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden rounded-[28px] bg-fg opacity-(--d) motion-reduce:hidden lg:block" />
      </article>
    </motion.li>
  );
}

function FitWidth({ width, children }: { width: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!el) return;
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
  }, [width]);
  return (
    <div ref={outer} className="w-full">
      
    </div>
  );
}
