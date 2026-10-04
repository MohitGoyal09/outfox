import { ScrollWordReveal } from "@/components/21st/scroll-word-reveal";
import { MARK_STROKE } from "@/lib/brandMark";

function Unlinked() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
      <circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth={MARK_STROKE * 0.45} />
    </svg>
  );
}

export function WillNotClaim() {
  return (
    <section id="limits" aria-labelledby="limits-heading" className="l-ink scroll-mt-20 bg-[var(--ink-base)] text-fg">
      <div className="l-wrap pt-24 lg:pt-32">
        <p className="l-eyebrow !text-fg-secondary">04&nbsp;&nbsp;What we will not claim</p>
        <h2 id="limits-heading" className="l-h2 mt-4 max-w-[16ch] text-fg">
          What Drishti will not tell you.
        </h2>
      </div>
      <div className="l-wrap">
        <ScrollWordReveal
          text={REVEAL}
          className="max-w-[26ch] font-display text-[clamp(1.75rem,1.1rem+2.8vw,3.5rem)] font-normal leading-[1.15] tracking-[-0.025em] text-fg sm:max-w-[30ch] lg:max-w-[34ch]"
        />
      </div>
      <div className="l-wrap pb-24 lg:pb-32">
        
      </div>
    </section>
  );
}
