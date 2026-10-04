"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { cn } from "@/lib/utils";
import { SOURCES } from "./landing-data";

function SourceCard({ s }: { s: (typeof SOURCES)[number] }) {
  return (
    <li className="flex shrink-0 items-center gap-3 rounded-[12px] border border-border bg-bg px-4 py-3 shadow-xs">
      
      <span className="flex flex-col">
        
        
      </span>
    </li>
  );
}

const listClass = "flex shrink-0 list-none items-center gap-4 p-0 pr-4 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:pr-0";

export function SourcesStrip() {
}
