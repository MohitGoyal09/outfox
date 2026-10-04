import { HookTable } from "./Bento";
import { HERO_FINDINGS, HOOK_MATRIX } from "./landing-data";

const card = "rounded-[12px] border border-border-strong bg-bg-raised shadow-lg";

export function SignalsReplica() {
  const top = HERO_FINDINGS[0];
}

export function AskReplica() {
}

const COLUMNS = [
  { title: "Hooks", cards: [{ t: HERO_FINDINGS[0].evidence[0].title, s: "youtube.com" }, { t: HERO_FINDINGS[0].evidence[2].title, s: HERO_FINDINGS[0].evidence[2].where }] },
  { title: "Offers", cards: [{ t: "FLAT ₹700 OFF on Orders", s: "SUGAR Cosmetics, search" }, { t: "Buy 2 Get 1 Free", s: "SUGAR Cosmetics, search" }] },
  { title: "To test", cards: [{ t: `${HERO_FINDINGS[1].brand}: ${HERO_FINDINGS[1].hook} at ${HERO_FINDINGS[1].brandShare}%, others ${HERO_FINDINGS[1].othersShare}%`, s: "From Signals" }, { t: `${HERO_FINDINGS[0].brand}: ${HERO_FINDINGS[0].hook} at ${HERO_FINDINGS[0].brandShare}%, others ${HERO_FINDINGS[0].othersShare}%`, s: "From Signals" }] },
] as const;
