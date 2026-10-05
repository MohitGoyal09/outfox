"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/components/aceternity/motion-utils";
import { RequestAccessForm } from "./RequestAccessForm";

function CornerMark({ className }: { className: string }) {
  return <Plus aria-hidden="true" strokeWidth={1.25} className={`absolute size-5 bg-[var(--ink-base)] text-fg-secondary ${className}`} />;
}

export function CtaBand() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const y = useTransform(scrollYProgress, [0, 1], ["-35%", "0%"]);
  return (
    <section ref={ref} id="request-access" aria-labelledby="cta-heading" className="l-ink relative scroll-mt-20 overflow-hidden bg-[var(--ink-base)]">
      <motion.div style={reduce ? undefined : { y }} className="will-change-transform">
        <div className="l-wrap py-20 lg:py-28">
          
        </div>
      </motion.div>
    </section>
  );
}
