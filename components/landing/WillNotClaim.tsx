import { ScrollWordReveal } from "@/components/21st/scroll-word-reveal";
import { MARK_STROKE } from "@/lib/brandMark";

function Unlinked() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="mt-0.5 shrink-0 text-accent-ink/70">
      <circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth={MARK_STROKE * 0.45} />
    </svg>
  );
}

export function WillNotClaim() {
  return (
    <section id="limits" aria-labelledby="limits-heading" className="scroll-mt-20 bg-accent text-accent-ink">
      <div className="l-wrap pt-24 lg:pt-32">
        <p className="l-eyebrow !text-accent-ink/60">04&nbsp;&nbsp;What we will not claim</p>
        <h2 id="limits-heading" className="l-h2 mt-4 max-w-[16ch] text-accent-ink">
          What Drishti will not tell you.
        </h2>
      </div>
      <div className="l-wrap">
        
      </div>
      <div className="l-wrap pb-24 lg:pb-32">
        <ul className="grid list-none gap-0 border-t border-white/12 md:grid-cols-3 md:gap-8">
          {ITEMS.map((it) => (
            <li key={it.title} className="flex gap-4 border-t border-white/12 py-6 first:border-t-0 md:border-t-0 md:pt-6">
              <Unlinked />
              <div>
                <h3 className="text-[1.0625rem] font-medium leading-[1.3] tracking-[-0.01em]">{it.title}</h3>
                <p className="mt-2 max-w-[36ch] text-[0.9375rem] leading-[1.55] text-accent-ink/70">{it.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
