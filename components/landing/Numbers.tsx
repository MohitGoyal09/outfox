import { CountUp } from "@/components/aceternity/count-up";
import { Scales } from "@/components/aceternity/scales";
import { CHECK_DATE, NUMBERS } from "./landing-data";

const toNumber = (s: string) => Number(s.replace(/,/g, ""));

const FIGURES = [
  { value: NUMBERS.sources, prefix: "", label: "public sources read per brand" },
  { value: toNumber(NUMBERS.findings), prefix: "", label: `findings across ${NUMBERS.brands} brands in their latest checks` },
  { value: toNumber(NUMBERS.tagged), prefix: "", label: `findings tagged for hook and funnel stage, ${NUMBERS.withHook} with a clear hook` },
  { value: toNumber(NUMBERS.searchesPerBrand), prefix: "~", label: "searches per brand per check" },
];

export function Numbers() {
  return (
    <section aria-labelledby="numbers-heading" className="l-wrap py-20 lg:py-28">
      <h2 id="numbers-heading" className="l-label">
        From the demo workspace, check of 
      </h2>
      <div className="relative mt-10 overflow-hidden rounded-[18px] border border-border bg-bg-raised">
        <Scales />
        <dl className="relative grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
        {FIGURES.map((f) => (
          <div key={f.label} className="flex flex-col rounded-[12px] border border-border bg-bg-raised p-5 sm:p-6">
            <dt className="order-2 mt-3 max-w-[26ch] text-[0.9375rem] leading-[1.45] text-fg-secondary">{f.label}</dt>
            <dd className="num order-1 text-[clamp(2.75rem,2rem+3vw,4.25rem)] font-light leading-none tracking-[-0.04em] text-fg">
              <CountUp value={f.value} prefix={f.prefix} />
            </dd>
          </div>
        ))}
        </dl>
      </div>
    </section>
  );
}
