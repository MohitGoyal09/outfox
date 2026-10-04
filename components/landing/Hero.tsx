"use client";

import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/aceternity/magnetic-button";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { AskBox } from "./AskBox";
import { CycleLine } from "./CycleLine";
import { Ribbon } from "./Ribbon";
import { HOOK_MATRIX } from "./landing-data";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative border-b border-border">
      <div className="relative isolate">
        <div className="l-wrap flex flex-col items-center pt-6 text-center sm:pt-8 lg:pt-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-white/85 px-3.5 py-1.5 text-[0.8125rem] font-medium text-fg-secondary backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#34d399]" />
            Competitor intelligence for marketing teams
          </p>
          <h1 id="hero-heading" className="l-display mt-5 max-w-[16ch] text-fg sm:mt-6 sm:max-w-[18ch] lg:max-w-none lg:text-[clamp(3rem,4.9vw,4.375rem)] lg:font-[500] lg:leading-none lg:tracking-[-0.03em]">
            See <span className="whitespace-nowrap">every move</span> your competitors make.
          </h1>
          <CycleLine className="relative mt-2 text-[1.0625rem] leading-[1.4] text-fg sm:text-[1.1875rem]" />
          <p className="l-lead mt-1 max-w-[34ch] text-balance sm:max-w-[52ch] lg:max-w-none">
            Drishti watches their ads, videos, search and news, tags every hook, and backs every insight with its source.
          </p>
          
          
        </div>
        <div className="relative mt-3 sm:mt-1">
          <Ribbon />
        </div>
        <p className="l-wrap pb-8 pt-2 text-center text-[0.8125rem] leading-[1.6] text-fg-secondary sm:pb-8">
          Tracking public brands in the demo workspace: {HOOK_MATRIX.map((b) => b.name).join(" · ")}
        </p>
      </div>
    </section>
  );
}
