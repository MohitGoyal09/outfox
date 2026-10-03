import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ClaimDoc } from "./brand-model";

export function EvidenceLink({ claims }: { claims: readonly ClaimDoc[] }) {
  if (claims.length === 0) return null;
  const engines = new Set(claims.map((claim) => claim.sourceEngine));
  const params = new URLSearchParams({ tab: "evidence" });
  if (engines.size === 1) params.set("engine", [...engines][0]);
  return (
    <Link
      href={`?${params.toString()}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-fg hover:underline"
    >
      See the {claims.length} finding{claims.length === 1 ? "" : "s"} behind this tab in Evidence
      <ArrowRight aria-hidden className="size-3.5" />
    </Link>
  );
}
