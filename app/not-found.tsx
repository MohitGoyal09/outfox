import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return <main className="flex min-h-dvh items-center justify-center bg-bg px-6 text-fg"><section className="max-w-md text-center"><FileQuestion className="mx-auto size-8 text-accent" strokeWidth={1.5} /><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-tertiary">404 · no record</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">That page is not in the atlas.</h1><p className="mt-3 text-sm leading-6 text-fg-secondary">The link may be old, or this research surface has not been created yet.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-accent underline decoration-border-strong underline-offset-4 hover:text-accent-strong"><ArrowLeft className="size-4" /> Return to Feed</Link></section></main>;
}
