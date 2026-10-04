"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
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
  wide?: boolean;
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
      
    </motion.li>
  );
}
