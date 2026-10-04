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
  plateClass: string;
  sr: string;
  ui: ReactNode;
  wide?: boolean;
  padX?: string;
};

const UNITS: Record<string, Unit> = {
  signals: {
    id: "signals",
    Icon: Activity,
    title: "Hook mix by brand",
    line: "Which hooks each rival leans on, with the biggest gaps called out.",
    seed: 1,
    plateClass: "h-[30rem] sm:h-[35rem]",
    sr: "The Signals page: a table of hook mix by brand, each cell shaded in its hook's colour, with the biggest gaps listed beside it.",
    ui: <SignalsReplica />,
    wide: true,
  },
  ask: {
    id: "ask",
    Icon: MessageSquareText,
    title: "Ask",
    line: "Answers with sources. Click any number to see the finding behind it.",
    seed: 2,
    plateClass: "h-[27.5rem]",
    sr: "An Ask answer about discount offers, with numbered source chips and the sources listed under it.",
    ui: <AskReplica />,
  },
  board: {
    id: "board",
    Icon: Pin,
    title: "Board",
    line: "Your swipe file. Pin real evidence into columns.",
    seed: 3,
    plateClass: "h-[27.5rem]",
    sr: "A board with three columns of saved evidence cards: hooks, offers and things to test.",
    ui: <BoardReplica />,
    padX: "sm:px-6",
  },
  ads: {
    id: "ads",
    Icon: Clock,
    title: "Ads, with how long they ran",
    line: "From Google Ads Transparency: the creative, its format and how many days it has run.",
    seed: 4,
    plateClass: "h-[28rem]",
    sr: "A real ad creative from Google Ads Transparency with its format and days shown.",
    ui: (
      <div className="mx-auto h-full w-full max-w-[12rem]">
        <AdCard />
      </div>
    ),
  },
  offtopic: {
    id: "offtopic",
    Icon: EyeOff,
    title: "Off-topic, set aside",
    line: "Plum the fruit is not Plum the brand. Findings that may not be about the brand are hidden, and you can always show them.",
    seed: 5,
    plateClass: "h-[28rem]",
    sr: "A note that findings that may not be about the brand are hidden, with examples.",
    ui: (
      <div className="min-h-[32rem] rounded-[12px] border border-border-strong bg-bg-raised p-5 shadow-lg">
        
      </div>
    ),
  },
};

function Showcase({ u, className }: { u: Unit; className?: string }) {
  const reduce = useReducedMotion();
  const inner = (
    <>
      <div className="flex items-center gap-2.5">
        <u.Icon strokeWidth={1.5} className="size-5 text-fg" />
        
      </div>
      <p className="l-copy mt-2 max-w-[56ch]">{u.line}</p>
      <Plate seed={u.seed} className={`mt-5 ${u.plateClass}`}>
        
        <div className={`h-full px-4 pt-8 ${u.padX ?? "sm:px-12"} sm:pt-12 ${u.wide ? "overflow-x-auto overflow-y-hidden" : ""}`}>{u.ui}</div>
      </Plate>
    </>
  );
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
