import { DetailsBento } from "./Bento";
import { AskReplica, BoardReplica, SignalsMobileReplica, SignalsReplica } from "./ProductReplicas";
import { StackedFeatures, type Feature } from "./StackedFeatures";
import { SectionCaption } from "./SectionCaption";

const FEATURES: readonly Feature[] = [
  {
    id: "signals",
    title: "Signals",
    line: "Which hooks each rival leans on, with the biggest gaps called out.",
    facts: ["Hook mix for every brand in one table", "Colour names the hook, depth is the share", "Hover a cell to see the findings behind it"],
    tint: "#60a5fa",
    image: "/landing/plate-ridge.webp",
    seed: 1,
    sr: "The Signals page: a table of hook mix by brand, each cell shaded in its hook's colour. Each number opens the findings behind it.",
    ui: <SignalsReplica />,
    fitWidth: 640,
    mobileUi: <SignalsMobileReplica />,
  },
  {
    id: "ask",
    title: "Ask",
    line: "Answers with sources. Click any number to see the finding behind it.",
    facts: ["Ask in plain words", "Every sentence cites a stored finding", "A number Drishti cannot trace is removed"],
    tint: "#2dd4bf",
    image: "/landing/plate-fog.webp",
    seed: 2,
    sr: "An Ask answer about discount offers, with numbered source chips and the sources listed under it.",
    ui: <AskReplica />,
  },
  {
    id: "board",
    title: "Board",
    line: "Your swipe file. Pin real evidence into columns.",
    facts: ["Hooks, offers, creatives, things to test", "Every card keeps its source", "Save evidence while you browse"],
    tint: "#f472b6",
    image: "/landing/plate-heather.webp",
    seed: 3,
    sr: "A board with three columns of saved evidence cards: hooks, offers and things to test.",
    ui: <BoardReplica />,
  },
];

export function ProductShowcase() {
  return (
    <section id="product" aria-labelledby="product-heading" className="l-wrap scroll-mt-20 py-20 lg:py-28">
      <p className="l-eyebrow">03&nbsp;&nbsp;Product</p>
      <h2 id="product-heading" className="l-h2 mt-3 max-w-[26ch] text-[clamp(1.875rem,1.2rem+2.6vw,3rem)] text-fg">
        Search, ads, YouTube, news and demand for each brand, in one place.
      </h2>
<SectionCaption items={["five public sources", "dated", "linked to the source"]} />
      <div className="mt-12 lg:mt-16">
        <StackedFeatures features={FEATURES} />
      </div>
      <h3 className="mt-20 max-w-[24ch] font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.03em] text-fg sm:text-[2rem] lg:mt-28">And the details that keep it honest.</h3>
      
    </section>
  );
}
