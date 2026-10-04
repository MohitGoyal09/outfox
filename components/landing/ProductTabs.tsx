"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ContainerScroll } from "@/components/aceternity/container-scroll-animation";
import { Lens } from "@/components/aceternity/lens";
import { EASE_OUT } from "@/components/aceternity/motion-utils";
import { TabPill, TabPillGroup } from "@/components/aceternity/tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SHOTS = [
  { value: "signals", label: "Signals", src: "/landing/signals.webp", alt: "The Signals page: a table of hook mix by brand, each cell shaded in its hook's colour.", caption: "Hook mix by brand. Which hooks each rival leans on, with the biggest gaps called out." },
  { value: "brand", label: "Brand", src: "/landing/brand.webp", alt: "A brand page for Minimalist: sources, top hooks and stage mix, with when each source was last checked.", caption: "One brand, every source. Search, ads, YouTube, news and demand, each with when it was last checked." },
  { value: "ask", label: "Ask", src: "/landing/ask.webp", alt: "An Ask answer with small numbered chips after each claim.", caption: "Answers with sources. Click any number to see the finding behind it." },
  { value: "board", label: "Board", src: "/landing/board.webp", alt: "A board with four columns of saved evidence cards: hooks, offers, creatives, things to test.", caption: "Your swipe file. Pin real evidence into columns: hooks, offers, creatives, things to test." },
] as const;

export function ProductTabs() {
  const [value, setValue] = useState<string>(SHOTS[0].value);
  const reduce = useReducedMotion();
  const active = SHOTS.find((s) => s.value === value) ?? SHOTS[0];
  return (
    <section id="product" aria-labelledby="product-heading" className="l-wrap scroll-mt-20 py-20 lg:py-28">
      <h2 id="product-heading" className="l-h2 max-w-[16ch] text-fg">
        One workspace for the whole read.
      </h2>
      <Tabs value={value} onValueChange={setValue} className="mt-10 gap-5">
        <TabPillGroup>
          
        </TabPillGroup>
        
        <ContainerScroll className="mt-2">
          {SHOTS.map((s) => (
            <TabsContent key={s.value} value={s.value} className="m-0">
              
            </TabsContent>
          ))}
        </ContainerScroll>
      </Tabs>
    </section>
  );
}
