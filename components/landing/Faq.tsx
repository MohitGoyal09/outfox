"use client";

import { useId, useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RequestAccessDialog } from "./RequestAccessDialog";

const FAQS = [
  { q: "Which sources does Drishti read?", a: "Google Search, Google Ads Transparency, YouTube (search and video details), Google News and Google Trends, all public." },
  { q: "Which brands can I track?", a: "Indian D2C skincare and beauty brands: your own and up to five competitors per check." },
  { q: "How fresh is the data?", a: "As fresh as your last check. Drishti does not refresh in the background; you run a check when you want new evidence, and every finding shows when it was fetched." },
  { q: "Does it show ad spend or sales?", a: "No. Public data shows ad presence and relative search interest, not spend or sales, and Drishti says so." },
  { q: "How does Ask avoid making things up?", a: "Answers are written only from stored findings, and every sentence must cite one. A sentence or number that cannot be traced is removed before you see it." },
  { q: "Who can use it?", a: "Drishti is invite-only for now. Request access and we will set up your workspace." },
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
    <section id="faq" aria-labelledby="faq-heading" className="l-wrap scroll-mt-20 py-20 lg:py-28">
      
    </section>
  );
}
