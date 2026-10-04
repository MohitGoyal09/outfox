import { Reveal } from "@/components/aceternity/reveal";
import { AskVisual, CheckVisual, TrackVisual } from "./HowItWorksVisuals";

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
