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
const CLOUD_DOTS = "#E8B4B4";
const CLOUD_SPEED = 0.08;

const HEAD = ["Screenshots and a spreadsheet", "A general AI chat", "Outfox"];
const ICON = { yes: Check, partial: Minus, no: X } as const;

export function Comparison() {
  const reduce = useReducedMotion();
  const near = useInView(cardRef, { once: true, margin: "300px 0px" });
  const inView = useInView(cardRef, { margin: "80px 0px" });
  return (
    <section aria-labelledby="compare-heading">
      <div className="l-wrap pb-24 pt-20 lg:pb-32 lg:pt-28">
        
      </div>
    </section>
  );
}
