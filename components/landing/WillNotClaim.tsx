"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { CHECK_DATE, HOOK_MATRIX, SUGAR_LONGEST_AD } from "./landing-data";

const SUGAR = HOOK_MATRIX[0];

type Row = {
  guess: { label: string; value: string };
  accent: string;
  proof: { title: string; body?: string; cite?: string; chip: string; chipHref?: string };
};

const ROWS: readonly Row[] = [
  {
    guess: { label: "Estimated spend", value: "₹12–18L a month" },
    accent: "var(--hook-education-explainer)",
    proof: {
      title: `Ran for ${SUGAR_LONGEST_AD.days} days on Google`,
      body: "The longest-running SUGAR ad, with Google's own days-shown count. Not a spend guess.",
      chip: `Google Ads Transparency · fetched ${CHECK_DATE}`,
      chipHref: SUGAR_LONGEST_AD.url,
    },
  },
  {
    guess: { label: "Engagement rate", value: "4.8%" },
    accent: "var(--hook-product-feature)",
    proof: {
      title: "Not checked, so never shown as zero",
      body: "Engagement was not measured in this check. Drishti names the gap instead of filling it.",
      chip: "Source status: not checked",
    },
  },
  {
    guess: { label: "ROAS", value: "3.4x" },
    accent: "var(--hook-founder-story)",
    proof: {
      title: "No source, no number",
      body: "Drishti cuts any figure it cannot trace. What ships looks like this:",
      cite: `${SUGAR.counts.education_explainer} of ${SUGAR.total} tagged SUGAR findings open with an explainer hook.`,
      chip: "[1] Latest check",
    },
  },
];

function Chip({ children, href }: { children: React.ReactNode; href?: string }) {
  const cls =
    "mt-3 inline-flex max-w-full items-center rounded-full border border-black/15 bg-black/[0.04] px-2.5 py-1 font-mono text-[0.6875rem] leading-[1.3] text-[#3f3f46]";
}

export function WillNotClaim() {
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduced = useReducedMotion();
}
