import { Reveal } from "@/components/aceternity/reveal";
import { AskVisual, CheckVisual, TrackVisual } from "./HowItWorksVisuals";
import { SectionCaption } from "./SectionCaption";

const STEPS = [
  {
    Visual: TrackVisual,
    title: "Track",
    body: "Add your brand and up to five rivals. Each is confirmed by finding its own website.",
  },
  {
    Visual: CheckVisual,
    title: "Check",
    body: "One check reads every source. Each finding keeps its link and fetch time.",
  },
  {
    Visual: AskVisual,
    title: "Ask",
    body: "Ask in plain words. Each sentence cites its finding, or the number is cut.",
  },
] as const satisfies readonly { Visual: () => React.JSX.Element; title: string; body: string }[];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-20">
      <div className="l-wrap pb-14 pt-16 lg:pb-14 lg:pt-20">
        <Reveal>
          <p className="l-eyebrow">02&nbsp;&nbsp;How it works</p>
          <h2 id="how-heading" className="l-h2 mt-3 max-w-[16ch] text-balance text-fg lg:max-w-none">
            Track a brand, run a check, ask a question.
          </h2>

        </Reveal>
        
      </div>
    </section>
  );
}
