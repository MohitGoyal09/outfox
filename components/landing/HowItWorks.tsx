import { Timeline } from "@/components/aceternity/timeline";
import { MARK_STROKE } from "@/lib/brandMark";
import { AskVisual, CheckVisual, TrackVisual } from "./HowItWorksVisuals";

function Marker({ kind }: { kind: "circle" | "line" | "dot" }) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" className="text-fg">
      
      {kind === "line" ? <line x1="6" y1="26" x2="26" y2="6" stroke="currentColor" strokeWidth={MARK_STROKE * 0.5} strokeLinecap="butt" /> : null}
      {kind === "dot" ? <circle cx="16" cy="16" r="10" fill="currentColor" /> : null}
    </svg>
  );
}

const STEPS = [
  {
    kind: "circle",
    Visual: TrackVisual,
    title: "Track",
    body: "Add your brand and up to five competitors. Drishti confirms each one by finding its own website.",
  },
  {
    kind: "line",
    Visual: CheckVisual,
    title: "Check",
    body: "One check reads every source for each brand and stores each finding with its link and the time it was fetched. About 7 searches per brand, shown before you start.",
  },
  {
    kind: "dot",
    Visual: AskVisual,
    title: "Ask",
    body: "Ask in plain words: “Who leans hardest on discount offers?” Every sentence in the answer cites the finding it came from. A number Drishti cannot trace is removed, not guessed.",
  },
] as const satisfies readonly { kind: string; Visual: () => React.JSX.Element; title: string; body: string }[];

const ENTRIES = STEPS.map((s, i) => ({
  key: s.title,
  marker: <Marker kind={s.kind} />,
  content: (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      
      <s.Visual />
    </div>
  ),
}));

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-20 border-t border-border bg-bg-raised">
      
    </section>
  );
}
