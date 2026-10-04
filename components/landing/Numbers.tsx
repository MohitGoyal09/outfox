"use client";

import { useState } from "react";
import { ChartLine } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/components/aceternity/motion-utils";
import { hookName } from "@/components/drishti/labels";
import { HOOK_COLOR } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";
import { CHECK_DATE, HOOK_MATRIX, HOOK_ORDER } from "./landing-data";
import { SectionCaption } from "./SectionCaption";

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
