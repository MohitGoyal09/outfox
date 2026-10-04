import { DetailsBento } from "./Bento";
import { AskReplica, BoardReplica, SignalsMobileReplica, SignalsReplica } from "./ProductReplicas";
import { StackedFeatures, type Feature } from "./StackedFeatures";

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
