import { Reveal } from "@/components/aceternity/reveal";
import { AskVisual, CheckVisual, TrackVisual } from "./HowItWorksVisuals";

const STEPS = [
  {
    Visual: TrackVisual,
    title: "Track",
    body: "Add your brand and up to five competitors. Drishti confirms each one by finding its own website.",
  },
  {
    Visual: CheckVisual,
    title: "Check",
    body: "One check reads every source for each brand and stores each finding with its link and the time it was fetched. About 7 searches per brand, shown before you start.",
  },
  {
    Visual: AskVisual,
    title: "Ask",
    body: "Ask in plain words: “Who leans hardest on discount offers?” Every sentence cites the finding it came from. A number Drishti cannot trace is removed, not guessed.",
  },
] as const satisfies readonly { Visual: () => React.JSX.Element; title: string; body: string }[];
