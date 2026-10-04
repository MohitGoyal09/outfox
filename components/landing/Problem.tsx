"use client";

import { Check, ExternalLink, X } from "lucide-react";
import { motion } from "motion/react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { CHECK_DATE, HERO_FINDINGS } from "./landing-data";

const TODAY = ["Nobody remembers where a number came from", "Nobody can check it", "Screenshots go stale in a deck"] as const;

export function Problem() {
  const reduce = useReducedMotion();
  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -8% 0px" },
          transition: { duration: 0.4, ease: EASE_OUT, delay: i * 0.07 },
        };
}
