import { cn } from "@/lib/utils";
import { CHECK_DATE, NUMBERS } from "./landing-data";

export function Numbers() {
  return (
    <section aria-labelledby="numbers-heading" className="l-wrap py-20 lg:py-28">
      <h2 id="numbers-heading" className="l-label">
        From the demo workspace, check of 
      </h2>
      <dl className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {FIGURES.map((f, i) => (
          <div key={f.label} className={cn("flex flex-col", i !== 0 && "lg:border-l lg:border-border lg:pl-8")}>
            <dt className="order-2 mt-3 max-w-[26ch] text-[0.9375rem] leading-[1.45] text-fg-secondary">{f.label}</dt>
            
          </div>
        ))}
      </dl>
    </section>
  );
}
