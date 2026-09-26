import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { AppShell } from "@/components/drishti/chrome/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <FileQuestion className="size-8 text-fg-tertiary" strokeWidth={1.5} />
        <h1 className="type-title mt-4 text-fg">That page is not in the atlas.</h1>
        <p className="mt-2 text-sm leading-6 text-fg-secondary">
          The link may be old, or this research surface has not been created yet.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-fg underline decoration-border-strong underline-offset-4 hover:text-fg-secondary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to your desk
        </Link>
      </section>
    </AppShell>
  );
}
