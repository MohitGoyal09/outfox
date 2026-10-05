"use client";


import { ThoughtLine, type ThoughtStep } from "@/components/drishti/ask/ThoughtLine";

const STEPS: ThoughtStep[] = [
  { id: "1", text: "Reading content tags", status: "complete" },
  { id: "2", text: "Reading content tags", status: "complete" },
  { id: "3", text: "Reading stored evidence", status: "running" },
];

export default function ThinkingHarness() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-10 bg-bg px-6 py-12">
      <ThoughtLine working steps={[]} />
      <ThoughtLine working steps={STEPS} />
      <ThoughtLine working={false} steps={STEPS.map((s) => ({ ...s, status: "complete" }))} elapsedSeconds={10.8} />
    </main>
  );
}
