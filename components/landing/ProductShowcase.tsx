import { DetailsBento } from "./Bento";
import { AskReplica, BoardReplica, SignalsMobileReplica, SignalsReplica } from "./ProductReplicas";
import { StackedFeatures, type Feature } from "./StackedFeatures";
import { SectionCaption } from "./SectionCaption";

export function ProductShowcase() {
  return (
    <section id="product" aria-labelledby="product-heading" className="l-wrap scroll-mt-20 py-20 lg:py-28">
      <p className="l-eyebrow">03&nbsp;&nbsp;Product</p>
      <h2 id="product-heading" className="l-h2 mt-3 max-w-[26ch] text-[clamp(1.875rem,1.2rem+2.6vw,3rem)] text-fg">
        Search, ads, YouTube, news and demand for each brand, in one place.
      </h2>
<SectionCaption items={["five public sources", "cited", "linked to the source"]} />
      <div className="mt-12 lg:mt-16">
        <StackedFeatures features={FEATURES} />
      </div>
      <h3 className="mt-20 max-w-[24ch] font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.03em] text-fg sm:text-[2rem] lg:mt-28">And the details that keep it honest.</h3>
      
    </section>
  );
}
