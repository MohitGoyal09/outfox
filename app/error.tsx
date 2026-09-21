"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-dvh items-center justify-center bg-bg px-6 text-fg"><section className="max-w-md text-center"><AlertTriangle className="mx-auto size-8 text-warn" strokeWidth={1.5} /><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-tertiary">Workspace error</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">The desk hit a rough edge.</h1><p className="mt-3 text-sm leading-6 text-fg-secondary">Your saved evidence is safe. Try the last action again.</p><Button onClick={reset} className="mt-7 gap-2 rounded-md bg-accent text-accent-ink hover:bg-accent-strong"><RotateCcw className="size-4" /> Try again</Button></section></main>;
}
