"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, X } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Dithering } from "@paper-design/shaders-react";
import { EASE_OUT } from "@/components/aceternity/motion-utils";
import { cn } from "@/lib/utils";
import { hasWebGL2 } from "./dither";

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
  return (
    <section aria-labelledby="compare-heading" className="border-t border-border">
      <div className="l-wrap pb-24 pt-20 lg:pb-32 lg:pt-28">
        <div ref={cardRef} className="relative isolate overflow-hidden rounded-[28px] border border-border bg-[#FDF6F6] px-5 pb-8 pt-10 sm:px-8 sm:pt-12 lg:px-12 lg:pb-12 lg:pt-14">
          {near ? <NoiseClouds reduce={reduce} inView={inView} /> : null}
        <p className="l-eyebrow">05&nbsp;&nbsp;Compared</p>
        <h2 id="compare-heading" className="l-h2 mt-4 max-w-[16ch] text-fg">
          Compared with how it is done today.
        </h2>
        <div className="mt-12 overflow-x-auto rounded-[20px] bg-white/90 px-3 pb-6 pt-6 sm:px-5">
          <div className="relative min-w-[44rem]">
            
            <table className="relative w-full table-fixed border-separate border-spacing-0 text-left">
              <caption className="sr-only">Drishti compared with a spreadsheet and a general AI chat</caption>
              <colgroup>
                
                
                
                
              </colgroup>
              <thead>
                <tr>
                  <td className="border-b border-border-strong" />
                  {HEAD.map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={cn(
                        "px-4 py-4 align-bottom text-[0.9375rem] font-medium",
                        i === 2 ? "border-b border-[rgba(255,240,235,0.14)] text-[#f7ede6]" : "border-b border-border-strong text-fg-secondary",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
