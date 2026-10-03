"use client";

import { Button } from "@/components/ui/button";

export function OffTopicNotice({
  hiddenCount,
  subject,
  showing,
  onToggle,
}: {
  hiddenCount: number;
  subject: string;
  showing: boolean;
  onToggle: () => void;
}) {
  if (hiddenCount <= 0) return null;
  const count = Intl.NumberFormat("en-US").format(hiddenCount);
  const noun = hiddenCount === 1 ? "finding that may" : "findings that may";
  return (
    <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
      {showing ? `Showing ${count} ${noun} not be about ${subject}.` : `Hiding ${count} ${noun} not be about ${subject}.`}
      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onToggle}>
        {showing ? "Hide them" : "Show them"}
      </Button>
    </p>
  );
}
