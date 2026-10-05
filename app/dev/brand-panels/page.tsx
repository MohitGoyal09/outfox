"use client";


import { useState } from "react";
import { FunnelPanel, HookChart, SummaryPanel } from "@/components/drishti/brands/EvidencePanels";
import type { DistributionItem } from "@/components/drishti/DistributionPanel";

const item = (label: string, count: number, delta: number): DistributionItem => ({ label, count, sharePct: null, delta });

const HOOKS = [
  item("visual_cold_open", 9, 8),
  item("social_proof", 8, 7),
  item("education_explainer", 6, -3),
  item("founder_story", 6, 6),
  item("product_feature", 5, -2),
  item("discount_offer", 4, 1),
  item("problem_solution", 1, -1),
  item("urgency_scarcity", 1, 1),
];
const STAGES = [item("unaware", 7, -7), item("problem_aware", 5, 2), item("solution_aware", 6, 3), item("product_aware", 13, 9), item("most_aware", 3, 2)];

export default function BrandPanelsHarness() {
  const [hook, setHook] = useState("all");
  const [stage, setStage] = useState("all");
  return (
    <main className="min-h-dvh bg-bg-raised-2 px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SummaryPanel title="Top hooks">
          <HookChart items={HOOKS} taggedCount={76} totalFindings={244} selectedHook={hook} onSelectHook={(v) => setHook(hook === v ? "all" : v)} />
        </SummaryPanel>
        <SummaryPanel title="Stage mix">
          <FunnelPanel items={STAGES} taggedCount={76} totalFindings={244} selectedStage={stage} onSelectStage={(v) => setStage(stage === v ? "all" : v)} />
        </SummaryPanel>
      </div>
    </main>
  );
}
