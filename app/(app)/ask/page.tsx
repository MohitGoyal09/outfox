import type { Metadata } from "next";
import { AskView } from "@/components/drishti/ask/AskView";

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

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <AskView
      cohortKey={firstString(params.cohort)}
      initialQuestion={firstString(params.q)}
    />
  );
}
