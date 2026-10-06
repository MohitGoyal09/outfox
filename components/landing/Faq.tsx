"use client";

import { useId, useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { SectionCaption } from "./SectionCaption";

export const FAQS = [
  { q: "Which sources does Outfox read?", a: "Google Search, Google Ads Transparency, YouTube (search and video details), Google News and Google Trends, all public." },
  { q: "Which brands can I track?", a: "Indian D2C skincare and beauty brands: your own and up to five competitors per check." },
  { q: "How fresh is the data?", a: "As fresh as your last check. Outfox does not refresh in the background; you run a check when you want new evidence." },
  { q: "Does it show ad spend or sales?", a: "No. Public data shows ad presence and relative search interest, not spend or sales, and Outfox says so." },
  { q: "How does Ask avoid making things up?", a: "Answers are written only from stored findings, and every sentence must cite one. A sentence or number that cannot be traced is removed before you see it." },
  { q: "Who can use it?", a: "Outfox is invite-only for now. Request access and we will set up your workspace." },
  { q: "Is my workspace private?", a: "Yes. Your brands, checks, boards and chats are visible only to your account. The evidence itself is public data." },
];

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border first:border-t">
      
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="l-wrap scroll-mt-20 pb-20 pt-24 lg:pb-28 lg:pt-32">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          
          <div className="flex max-w-sm flex-col gap-3 rounded-[14px] border border-border bg-bg-raised p-5 shadow-xs">
            <p className="text-[1.0625rem] font-medium leading-[1.3] text-fg">Not answered here?</p>
            <p className="flex items-start gap-2 text-[0.9375rem] leading-[1.5] text-fg-secondary">
              <Mail aria-hidden="true" className="mt-1 size-4 shrink-0" />
              Request access and tell us what you want to check. We will reply with your workspace.
            </p>
            <RequestAccessDialog>
              
            </RequestAccessDialog>
          </div>
        </div>
        <div>
          
        </div>
      </div>
    </section>
  );
}
