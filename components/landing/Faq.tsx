"use client";

import { useId, useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RequestAccessDialog } from "./RequestAccessDialog";

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
