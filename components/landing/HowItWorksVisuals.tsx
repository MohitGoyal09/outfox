import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { sourceColor } from "@/components/drishti/tokens";
import { ASK, MINIMALIST } from "./landing-data";

export function TrackVisual() {
  const b = MINIMALIST;
  return (
    <div className={frame}>
      <div className="flex flex-wrap items-center gap-2">
        
        
      </div>
      
      
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
        
        <div>
          <dd className="num text-[1.75rem] font-light leading-none tracking-[-0.03em] text-fg">{b.tagged}</dd>
          <dt className="mt-1.5 text-[12px] text-fg-secondary">tagged findings</dt>
        </div>
      </dl>
    </div>
  );
}

const chip = "num mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-[5px] border border-border bg-bg-inset px-1 align-[0.1em] text-[10px] text-fg-secondary";

export function AskVisual() {
  const b = ASK.bullets[0];
}
