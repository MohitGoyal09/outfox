import { humanize } from "@/components/drishti/labels";

const STATUS_WORDS: Readonly<Record<string, string>> = {
  ready: "Ready",
  pending: "Pending",
  needs_confirmation: "Needs confirmation",
  partial: "Partial",
  complete: "Complete",
  failed: "Failed",
  running: "Running",
};

export function statusLabel(status: string): string {
  return STATUS_WORDS[status] ?? humanize(status);
}
