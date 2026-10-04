import { CountUp } from "@/components/aceternity/count-up";
import { hookName } from "@/components/drishti/labels";
import { HOOK_COLOR } from "@/components/drishti/tokens";
import { CHECK_DATE, HOOK_MATRIX, HOOK_ORDER, NUMBERS } from "./landing-data";

const toNumber = (s: string) => Number(s.replace(/,/g, ""));
const TOP3 = MIX.slice(0, 3);
const pct = (n: number) => Math.round((n / MIX_TOTAL) * 100);

export function Numbers() {
  return (
    <section aria-labelledby="numbers-heading" className="l-wrap py-20 lg:py-28">
      <h2 id="numbers-heading" className="l-label">
        From the demo workspace, check of 
      </h2>

      <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        

        <figure aria-labelledby="mix-caption">
          
          
          <figcaption id="mix-caption" className="mt-4 text-[0.8125rem] leading-[1.45] text-fg-secondary">
            Hook mix of the {MIX_TOTAL} findings with a clear hook, all brands.
          </figcaption>
        </figure>
      </div>

      

      <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
        {SMALL.map((f) => (
          <div key={f.label} className="flex flex-col">
            
            <dt className="order-2 mt-3 text-[0.6875rem] font-medium uppercase leading-[1.4] tracking-[0.08em] text-fg-secondary">{f.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
