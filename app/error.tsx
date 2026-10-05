"use client";

import { EmptyState, PageHeader, PillButton } from "@/components/drishti";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex bg-bg-raised-2 min-h-dvh items-center justify-center px-6 text-fg">
      <div className="w-full max-w-xl">
        <PageHeader eyebrow="Workspace error" title="The desk hit a rough edge." />
        <EmptyState
          bounded
          title="Nothing was lost"
          description="Your saved evidence is safe. Try the last action again."
          action={<PillButton onClick={reset}>Try again</PillButton>}
        />
      </div>
    </main>
  );
}
