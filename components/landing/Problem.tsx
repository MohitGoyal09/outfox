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
  return (
    <section aria-labelledby="problem-heading" className="l-wrap pb-20 pt-24 lg:pb-28 lg:pt-36">
      <p className="l-eyebrow">01&nbsp;&nbsp;The problem</p>
      <h2 id="problem-heading" className="l-h2 mt-4 max-w-[18ch] text-fg">
        Competitor research is screenshots in a spreadsheet.
      </h2>
      <p className="l-copy mt-5 max-w-[56ch] text-[1.0625rem] leading-[1.6]">
        Someone searches each rival, saves a few ads, skims YouTube, and pastes it into a deck. Drishti keeps the trail: what was found, where, and when.
      </p>

      

    </section>
  );
}
