"use client";

import { motion } from "motion/react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { SectionCaption } from "./SectionCaption";

export function WatchesGrid() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="watches-heading" className="l-wrap py-20 lg:py-28">
      
      <h2 id="watches-heading" className="l-h2 mt-4 max-w-[20ch] text-balance text-fg">
        Five public sources. Every finding dated.
      </h2>
      <SectionCaption items={["public sources only", "dated", "no logins"]} />
      <ul className="m-0 mt-10 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
        {WATCHES.map((w) => (
          <li key={w.engine} className="flex flex-col rounded-[16px] border border-border bg-white p-5">
            <span className="flex size-11 items-center justify-center rounded-[12px] border border-border bg-bg">
              <PlatformLogo engine={w.engine} className="size-6" />
            </span>
            <h3 className="mt-5 text-[1rem] font-medium leading-[1.25] text-fg">{w.name}</h3>
            <p className="mt-2 text-[0.875rem] leading-[1.5] text-fg-secondary">{w.captures}</p>
            <Struck text={w.manual} reduce={reduce} />
          </li>
        ))}
      </ul>
    </section>
  );
}
