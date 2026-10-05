"use client";

import { RelativeTime } from "../RelativeTime";
import { PlatformLogo } from "./PlatformLogo";
import { latestCheckBySource, type ClaimDoc, type EngineCoverageRow, type SourceCheck } from "./brand-model";

function CheckText({ check }: { check: SourceCheck }) {
  const when = <RelativeTime iso={check.checkedAt} className="font-mono tabular-nums" />;
  switch (check.state) {
    case "ok":
      return <>Checked{check.isStale ? <> {when}</> : null}{check.reason ? `. ${check.reason}` : ""}</>;
    case "empty":
      return <>Checked{check.isStale ? <> {when}</> : null}, nothing found{check.reason ? `. ${check.reason}` : ""}</>;
    case "failed":
      return <>Check failed: {check.reason ?? "no reason recorded"} ({when})</>;
    case "unavailable":
      return <>Source unavailable: {check.reason ?? "no reason recorded"} ({when})</>;
    default:
      return <>Not checked yet</>;
  }
}

export function SourceFreshness({ coverage, latestClaims, now }: { coverage: EngineCoverageRow[]; latestClaims: ClaimDoc[]; now: number }) {
  const checks = latestCheckBySource(coverage, latestClaims, now);
  const notable = checks.filter((check) => check.state !== "ok" || check.isStale || check.reason);
  if (notable.length === 0) {
    return <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">All {checks.length} sources checked in the latest check.</p>;
  }
  return (
    <div className="mt-4 border-t border-border pt-3">
      <h3 className="mb-2 text-xs font-medium text-fg-secondary">Needs a look</h3>
      <ul className="space-y-1.5">
        {notable.map((check) => (
          <li key={check.engine} className="flex items-start gap-2 text-xs text-muted-foreground">
            <PlatformLogo engine={check.engine} className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0">
              <span className="text-fg">{check.label}</span>: <CheckText check={check} />
              {check.isStale ? <span className="ml-1.5 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-fg-secondary">Stale</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
