import type { Metadata } from "next";
import { AskView } from "@/components/drishti/ask/AskView";
import { AppShell } from "@/components/drishti/chrome/AppShell";
import type { Id } from "@/convex/_generated/dataModel";

export const metadata: Metadata = {
  title: "Ask",
};

function firstString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (Array.isArray(value)) return firstString(value[0]);
  return null;
}

function brandIdsFromParam(value: string | null): Id<"brands">[] {
  if (value === null) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "") as Id<"brands">[];
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <AskView
        initialChatId={firstString(params.chat) ?? firstString(params.cohort)}
        cohortKey={firstString(params.cohort)}
        initialQuestion={firstString(params.q) ?? firstString(params.prompt)}
        initialBrandIds={brandIdsFromParam(firstString(params.brands))}
      />
    </AppShell>
  );
}
