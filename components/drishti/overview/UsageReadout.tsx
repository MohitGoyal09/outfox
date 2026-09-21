"use client";

import { LABEL_CLASS, VALUE_CLASS } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { formatUsd, type UsageView } from "./digest";

type UsageRow = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  absent?: boolean;
};

export function UsageReadout({ usage }: { usage: UsageView }) {
  const rows: UsageRow[] = [];

  rows.push({
    key: "searches",
    label: "searches",
    value: usage.searches === null ? "not reported" : String(usage.searches),
    absent: usage.searches === null,
  });

  rows.push({
    key: "searches-left",
    label: "searches left",
    value:
      usage.searchesLeftAfter === null
        ? "not reported"
        : String(usage.searchesLeftAfter),
    absent: usage.searchesLeftAfter === null,
  });

  rows.push({
    key: "credits",
    label: "credits",
    value: usage.creditsReported
      ? usage.credits === null
        ? "reported, count unavailable"
        : `${usage.credits} reported`
      : "not reported by the provider",
    absent: !usage.creditsReported || usage.credits === null,
  });

  rows.push({
    key: "model-calls",
    label: "model calls",
    value: usage.llmRequests === null ? "not reported" : String(usage.llmRequests),
    absent: usage.llmRequests === null,
  });

  rows.push({
    key: "tokens",
    label: "tokens",
    value: usage.llmTokens === null ? "not reported" : String(usage.llmTokens),
    absent: usage.llmTokens === null,
  });

  const exact = usage.exactCostUsd;
  const estimated = usage.estimatedCostUsd;
  const hasExact = exact !== null && exact > 0;
  const hasEstimated = estimated !== null && estimated > 0;

  if (hasExact) {
    rows.push({
      key: "cost-exact",
      label: "cost, exact",
      value: formatUsd(exact),
      hint: "as billed by the provider",
    });
  }
  if (hasEstimated) {
    rows.push({
      key: "cost-estimated",
      label: "cost, estimated",
      value: formatUsd(estimated),
      hint: "from list prices, not a bill",
    });
  }
  if (!hasExact && !hasEstimated) {
    rows.push({
      key: "cost",
      label: "cost",
      value: "not reported for this run",
      absent: true,
    });
  }

  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.key} className="flex min-w-0 flex-col gap-0.5">
          <dt className={cn(LABEL_CLASS, "text-fg-tertiary")}>{row.label}</dt>
          <dd
            className={cn(
              VALUE_CLASS,
              "text-[12.5px] [overflow-wrap:anywhere]",
              row.absent ? "text-fg-tertiary" : "text-fg",
            )}
          >
            {row.value}
          </dd>
          {row.hint ? (
            <dd className="type-caption text-fg-tertiary">{row.hint}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
