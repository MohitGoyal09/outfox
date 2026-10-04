"use client";

import type { ComponentType, ReactNode } from "react";
import { Activity, Clock, EyeOff, MessageSquareText, Pin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/aceternity/motion-utils";
import { AdCard, OffTopic } from "./Bento";
import { Plate } from "./Plate";
import { AskReplica, BoardReplica, SignalsReplica } from "./ProductReplicas";

type Unit = {
  id: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  line: string;
  seed: number;
  image: string;
  tint: string;
  plateClass: string;
  sr: string;
  ui: ReactNode;
  wide?: boolean;
  padX?: string;
};

function Showcase({ u, className }: { u: Unit; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{inner}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {inner}
    </motion.div>
  );
}

export function ProductShowcase() {
  return (
    <section id="product" aria-labelledby="product-heading" className="l-wrap scroll-mt-20 py-20 lg:py-28">
      <p className="l-eyebrow">03&nbsp;&nbsp;Product</p>
      <h2 id="product-heading" className="l-h2 mt-3 max-w-[16ch] text-fg">
        One workspace for the whole read.
      </h2>
      <div className="mt-12 flex flex-col gap-14 lg:gap-20">
        <Showcase u={UNITS.signals} />
        
        
      </div>
    </section>
  );
}
