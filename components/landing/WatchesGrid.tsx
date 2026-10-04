"use client";

import { motion } from "motion/react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { SectionCaption } from "./SectionCaption";

function Struck({ text, reduce }: { text: string; reduce: boolean }) {
  return (
    <motion.p
      className="mt-auto pt-5 font-mono text-[12px] leading-[1.4] text-fg-tertiary"
      initial="off"
      whileInView="on"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      <span className="sr-only">Done by hand today: </span>
      <motion.span
        className="underline-offset-0 [text-decoration-line:line-through] [text-decoration-thickness:1px]"
        variants={{ off: { textDecorationColor: reduce ? "currentColor" : "rgba(0,0,0,0)" }, on: { textDecorationColor: "currentColor" } }}
        transition={{ duration: reduce ? 0 : 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.25 }}
      >
        {text}
      </motion.span>
    </motion.p>
  );
}

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
