"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/components/aceternity/motion-utils";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/aceternity/hero-highlight";
import { MagneticButton } from "@/components/aceternity/magnetic-button";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { HeroBackdrop, useMedia } from "./HeroBackdrop";
import { TrailVisual } from "./TrailVisual";

export const HERO_SUB = "See what your rivals' ads, videos and search results lean on, with every number linked to its source.";

const DRIFT = 0.35;
const DRIFT_PHONE = 0.2;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const wide = useMedia("(min-width: 768px)");
  const textY = useTransform(p, [0, 1], [0, -24]);
}
