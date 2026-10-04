"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { cn } from "@/lib/utils";
import { SOURCES } from "./landing-data";

const listClass = "flex shrink-0 list-none items-center gap-4 p-0 pr-4 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:pr-0";

export function SourcesStrip() {
  return (
    <section aria-labelledby="sources-heading">
      <div className="l-wrap flex items-center justify-between gap-4 pt-10">
        
        
      </div>
      <div className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] motion-reduce:l-wrap motion-reduce:overflow-visible motion-reduce:[mask-image:none]">
        <div
          className={cn("l-marquee-track flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none", paused && "[animation-play-state:paused]")}
        >
          <ul className={listClass}>
            
          </ul>
          <ul aria-hidden="true" className={cn(listClass, "motion-reduce:hidden")}>
            
          </ul>
        </div>
      </div>
      <div className="l-wrap pb-10 pt-6">
        
      </div>
    </section>
  );
}
