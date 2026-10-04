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
