import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestAccessForm } from "./RequestAccessForm";

function CornerMark({ className }: { className: string }) {
  return <Plus aria-hidden="true" strokeWidth={1.25} className={`absolute size-5 bg-[var(--ink-base)] text-white/40 ${className}`} />;
}

export function CtaBand() {
  return (
    <section id="request-access" aria-labelledby="cta-heading" className="scroll-mt-20 bg-accent">
      <div className="l-ink">
        
      </div>
    </section>
  );
}
