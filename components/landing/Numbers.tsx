"use client";

import { useState } from "react";
import { ChartLine } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { hookName } from "@/components/drishti/labels";
import { HOOK_COLOR } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";
import { CHECK_DATE, HOOK_MATRIX, HOOK_ORDER } from "./landing-data";

type Hook = (typeof HOOK_ORDER)[number];

const Y_MAX = 50;
const TICKS = [0, 10, 20, 30, 40, 50];
const EASE = [0.22, 1, 0.36, 1] as const;

const shares = (h: Hook) => HOOK_MATRIX.map((b) => (b.counts[h] / b.total) * 100);
const spread = (h: Hook) => {
  const s = shares(h);
  return Math.max(...s) - Math.min(...s);
};
const CHOICES = [...HOOK_ORDER].sort((a, b) => spread(b) - spread(a)).slice(0, 4);
const yPct = (v: number) => 100 - (v / Y_MAX) * 100;
const shortName = (n: string) => n.split(" ")[0];

export function Numbers() {
  const reduce = useReducedMotion();
  const values = shares(hook);
  const pts = values.map((v, i) => [xPct(i), yPct(v)] as const);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    (e.currentTarget.parentElement?.querySelector(`[data-hook="${next}"]`) as HTMLElement | null)?.focus();
  };
}
