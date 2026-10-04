import { Activity, Building2, Home, LayoutGrid } from "lucide-react";
import { hookName } from "@/components/drishti/labels";
import { HOOK_COLOR, isHookType } from "@/components/drishti/tokens";
import { HookTable } from "./Bento";
import { HERO_FINDINGS, HOOK_MATRIX } from "./landing-data";

const card = "rounded-[12px] border border-border-strong bg-bg-raised shadow-lg";

const NAV = [
  { label: "Home", Icon: Home },
  { label: "Brands", Icon: Building2 },
  { label: "Signals", Icon: Activity },
  { label: "Boards", Icon: LayoutGrid },
] as const;

function hookKey(label: string) {
  return Object.keys(HOOK_COLOR).find((k) => isHookType(k) && hookName(k) === label);
}

export function SignalsReplica() {
  const top = HERO_FINDINGS[0];
  return (
    <div aria-hidden="true" className={`${card} flex min-w-[46rem] min-h-[34rem] overflow-hidden`}>
      
      
      <aside className="hidden w-60 shrink-0 border-l border-border p-4 lg:block">
        <p className="text-[14px] font-semibold text-fg">Gaps</p>
        
      </aside>
    </div>
  );
}

export function AskReplica() {
}

const COLUMNS = [
  { title: "Hooks", cards: [{ t: HERO_FINDINGS[0].evidence[0].title, s: "youtube.com" }, { t: HERO_FINDINGS[0].evidence[2].title, s: HERO_FINDINGS[0].evidence[2].where }] },
  { title: "Offers", cards: [{ t: "FLAT ₹700 OFF on Orders", s: "SUGAR Cosmetics, search" }, { t: "Buy 2 Get 1 Free", s: "SUGAR Cosmetics, search" }] },
  { title: "To test", cards: [{ t: `${HERO_FINDINGS[1].brand}: ${HERO_FINDINGS[1].hook} at ${HERO_FINDINGS[1].brandShare}%, others ${HERO_FINDINGS[1].othersShare}%`, s: "From Signals" }, { t: `${HERO_FINDINGS[0].brand}: ${HERO_FINDINGS[0].hook} at ${HERO_FINDINGS[0].brandShare}%, others ${HERO_FINDINGS[0].othersShare}%`, s: "From Signals" }] },
] as const;
