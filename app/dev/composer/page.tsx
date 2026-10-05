"use client";


import { useRef, useState } from "react";
import type { ChatStatus } from "ai";
import { AskComposer } from "@/components/drishti/ask/AskComposer";

const STATES: { label: string; status: ChatStatus; value?: string; chips?: boolean; error?: boolean; over?: boolean; disabled?: boolean }[] = [
  { label: "empty", status: "ready" },
  { label: "typing", status: "ready", value: "Which rival is leaning hardest on discount hooks?" },
  { label: "multi-line", status: "ready", value: "Compare SUGAR and Mamaearth.\nUse the last 90 days.\nShow the evidence for each claim and flag anything stale." },
  { label: "chips", status: "ready", value: "How do they differ?", chips: true },
  { label: "submitted", status: "submitted", value: "Which rival ran the longest ad?" },
  { label: "streaming", status: "streaming", value: "Which rival ran the longest ad?" },
  { label: "error", status: "error", value: "Which rival ran the longest ad?", error: true },
  { label: "over cap", status: "ready", value: "x".repeat(2010), over: true },
];

function Fixture({ s, docked }: { s: (typeof STATES)[number]; docked?: boolean }) {
  const [value, setValue] = useState(s.value ?? "");
  const [chips, setChips] = useState(s.chips ? [{ id: "1", name: "SUGAR" }, { id: "2", name: "Mamaearth" }] : []);
  const [log, setLog] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const generating = s.status === "submitted" || s.status === "streaming";
  return (
    <section data-state={s.label} className={docked ? "bg-bg px-4 pb-5 pt-8" : ""}>
      <p className="mb-2 text-xs text-fg-tertiary">
        {s.label} {docked ? "(dock)" : ""} <span data-log>{log}</span>
      </p>
      <AskComposer
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setLog("esc");
        }}
        onSubmit={(t) => {
          setLog(`sent:${t.length}`);
          setValue("");
        }}
        status={s.status}
        onStop={() => {
          setLog("stopped");
          requestAnimationFrame(() => ref.current?.focus());
        }}
        disabled={generating}
        canSend={value.trim().length > 0}
        overCap={value.length > 2000}
        maxChars={2000}
        placeholder="Which rival is leaning hardest on discount hooks?"
        textareaRef={ref}
        chips={chips}
        onRemoveChip={(id) => setChips((c) => c.filter((x) => x.id !== id))}
        onMention={() => setLog("mention")}
        onClear={s.label === "chips" || s.error ? () => setLog("clear") : undefined}
        trailing={s.label === "chips" ? <button type="button" className="rounded-full px-2 py-1 text-[12px] text-fg-secondary">Sources (4)</button> : undefined}
        note={
          s.error ? (
            <p role="alert" className="mt-2 text-[12.5px] text-danger">
              Something went wrong. <button type="button" className="underline">Retry</button>
            </p>
          ) : null
        }
      />
    </section>
  );
}

export default function ComposerHarness() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 sm:p-8">
      {STATES.map((s) => (
        <Fixture key={s.label} s={s} />
      ))}
      <Fixture s={STATES[0]} docked />
    </main>
  );
}
