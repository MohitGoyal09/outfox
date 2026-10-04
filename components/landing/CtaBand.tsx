import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestAccessForm } from "./RequestAccessForm";

function CornerMark({ className }: { className: string }) {
  return <Plus aria-hidden="true" strokeWidth={1.25} className={`absolute size-5 bg-[var(--ink-base)] text-fg-secondary ${className}`} />;
}

export function CtaBand() {
  return (
    <section id="request-access" aria-labelledby="cta-heading" className="l-ink scroll-mt-20 bg-[var(--ink-base)]">
      <div>
        <div className="l-wrap py-20 lg:py-28">
          
        </div>
      </div>
    </section>
  );
}
