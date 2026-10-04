import Link from "next/link";
import { cn } from "@/lib/utils";
import { hookName } from "../labels";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { FOCUS_RING_CLASS, LABEL_CLASS, VALUE_CLASS, formatSharePct } from "../tokens";
import {
  MIN_HOOK_SAMPLE,
  type BrandHookMatrix as Matrix,
  type HookMatrixRow,
  type HookOverIndex,
} from "./board-model";

const MAX_SHADE = 28;

function evidenceHref(brandId: string, hook: string): string {
  return `/brands/${brandId}?tab=evidence&hook=${hook}`;
}

function shade(sharePct: number | null): string | undefined {
  if (sharePct === null || sharePct <= 0) return undefined;
  const pct = Math.min(MAX_SHADE, (sharePct / 100) * MAX_SHADE * 2);
  return `color-mix(in oklab, var(--accent) ${pct.toFixed(1)}%, transparent)`;
}

export function BrandHookMatrixSkeleton() {
  return (
    <SkeletonRegion label="Loading hook mix by brand" className="rounded-lg border border-border bg-bg-raised p-4 shadow-xs">
      <Skeleton variant="text" width="26%" height={12} />
      <span className="mt-4 block">
        <Skeleton variant="row" height={40} />
      </span>
      <span className="mt-2 block">
        <Skeleton variant="row" height={40} />
      </span>
    </SkeletonRegion>
  );
}

export function BrandHookMatrix({
  matrix,
  callouts,
  loading = false,
  className,
}: {
  matrix: Matrix;
  callouts: HookOverIndex[];
  loading?: boolean;
  className?: string;
}) {
  if (loading) return <BrandHookMatrixSkeleton />;
  if (matrix.rows.length < 2) return null;
  const { hooks, rows } = matrix;
  const span = hooks.length + 1;
  return (
    <Panel interactive={false} className={cn("flex min-w-0 flex-col", className)} ariaLabel="Hook mix by brand">
      <header className="border-b border-border px-5 py-4">
        <h3 className="type-headline text-fg">Hook mix by brand</h3>
        <p className="mt-1 type-caption text-fg-secondary">
          Shares are of each brand&apos;s tagged findings with a clear hook, a sample, not all evidence. Shares are
          hidden under {MIN_HOOK_SAMPLE}.
        </p>
      </header>

      {callouts.length > 0 ? (
        <ul className="flex flex-col gap-2 border-b border-border px-5 py-3">
          {callouts.map((callout) => (
            <li key={callout.brandId} className="text-[13px] leading-[1.5] text-fg-secondary">
              {callout.text}{" "}
              <Link
                href={evidenceHref(callout.brandId, callout.hook)}
                className={cn("whitespace-nowrap text-fg underline underline-offset-2", FOCUS_RING_CLASS)}
              >
                See the {Intl.NumberFormat("en-US").format(callout.count)} {callout.count === 1 ? "finding" : "findings"}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {hooks.length === 0 ? (
        <p className="px-5 py-4 text-[13px] text-fg-secondary">
          No brand has a tagged finding with a clear hook yet.
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" aria-label="Hook mix by brand">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className={cn(LABEL_CLASS, "sticky left-0 z-10 bg-bg-raised py-2 pl-5 pr-3 text-left text-fg-tertiary")}
                >
                  Brand
                </th>
                {hooks.map((hook) => (
                  <th key={hook} scope="col" className={cn(LABEL_CLASS, "min-w-24 px-2 py-2 text-right text-fg-tertiary")}>
                    {hookName(hook)}
                  </th>
                ))}
                <th scope="col" className={cn(LABEL_CLASS, "min-w-24 py-2 pl-2 pr-5 text-right text-fg-tertiary")}>
                  Clear-hook findings
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MatrixRow key={row.brandId} row={row} hooks={hooks} span={span} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function MatrixRow({ row, hooks, span }: { row: HookMatrixRow; hooks: string[]; span: number }) {
  const untagged = row.clearTotal === 0 && row.unclear === 0;
  return (
    <tr className="border-b border-border last:border-b-0">
      <th
        scope="row"
        className={cn(
          "sticky left-0 z-10 max-w-[10rem] bg-bg-raised py-2 pl-5 pr-3 text-left align-middle text-fg",
          row.isOwn ? "font-semibold" : "font-medium",
        )}
      >
        {row.name}
        {row.isOwn ? (
          <span className="ml-1.5 rounded-sm bg-[var(--bg-inset)] px-1 py-px text-[10.5px] font-normal text-fg-secondary">
            You
          </span>
        ) : null}
      </th>
      {untagged ? (
        <td colSpan={span} className="px-2 py-2 pr-5 text-fg-tertiary">
          Not tagged yet
        </td>
      ) : (
        <>
          {hooks.map((hook) => (
            <HookCell key={hook} row={row} hook={hook} />
          ))}
          <td className={cn(VALUE_CLASS, "py-2 pl-2 pr-5 text-right align-middle text-fg")}>
            {Intl.NumberFormat("en-US").format(row.clearTotal)}
            {row.enoughSample ? null : (
              <span className="block font-sans text-[11px] font-normal text-fg-tertiary">
                Too few to share ({Intl.NumberFormat("en-US").format(row.clearTotal)})
              </span>
            )}
          </td>
        </>
      )}
    </tr>
  );
}

function HookCell({ row, hook }: { row: HookMatrixRow; hook: string }) {
  const cell = row.cells[hook];
  const count = cell?.count ?? 0;
  if (count === 0) {
    return <td className={cn(VALUE_CLASS, "px-2 py-2 text-right align-middle text-fg-tertiary")}>0</td>;
  }
  const share = cell.sharePct;
  const noun = count === 1 ? "finding" : "findings";
  const label = `${row.name}, ${hookName(hook)}: ${count} ${noun}${share === null ? "" : `, ${formatSharePct(Math.round(share))}`}`;
  return (
    <td className="p-0 align-middle" style={{ backgroundColor: shade(share) }}>
      <Link
        href={evidenceHref(row.brandId, hook)}
        aria-label={label}
        className={cn("block px-2 py-2 text-right", FOCUS_RING_CLASS)}
      >
        {share === null ? (
          <span className={cn(VALUE_CLASS, "text-fg")}>{Intl.NumberFormat("en-US").format(count)}</span>
        ) : (
          <>
            <span className={cn(VALUE_CLASS, "text-fg")}>{formatSharePct(Math.round(share))}</span>
            <span className={cn(VALUE_CLASS, "ml-1 text-[11px] text-fg-tertiary")}>{Intl.NumberFormat("en-US").format(count)}</span>
          </>
        )}
      </Link>
    </td>
  );
}
