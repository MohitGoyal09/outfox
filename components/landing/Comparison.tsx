"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, X } from "lucide-react";
import { motion, useInView } from "motion/react";
import { Dithering } from "@paper-design/shaders-react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { cn } from "@/lib/utils";
import { hasWebGL2 } from "./dither";
import { SectionCaption } from "./SectionCaption";

type Kind = "yes" | "partial" | "no";
type Cell = { kind: Kind; label: string };

const yes = (label: string): Cell => ({ kind: "yes", label });
const no = (label: string): Cell => ({ kind: "no", label });

const ROWS: readonly { label: string; cells: readonly [Cell, Cell, Cell] }[] = [
  { label: "Every number links to its source", cells: [partial("Rarely"), no("No"), yes("Yes")] },
  { label: "Knows when each finding was fetched", cells: [no("No"), no("No"), yes("Yes")] },
  { label: "Hooks and funnel stages tagged", cells: [partial("By hand"), partial("Guessed"), yes("Per finding")] },
  { label: "Says when data is missing", cells: [no("No"), no("No"), yes("Names the gap")] },
  { label: "Ads with run length", cells: [partial("By hand"), no("No"), yes("Yes")] },
  { label: "Untraceable numbers removed", cells: [no("No"), no("No"), yes("Yes")] },
  { label: "Saves evidence to a board", cells: [partial("By hand"), no("No"), yes("Yes")] },
];
const CLOUD_DOTS = "#E8B4B4";
const CLOUD_SPEED = 0.08;
const ICON = { yes: Check, partial: Minus, no: X } as const;

export function Comparison() {
  const reduce = useReducedMotion();
  const near = useInView(cardRef, { once: true, margin: "300px 0px" });
  const inView = useInView(cardRef, { margin: "80px 0px" });
}
