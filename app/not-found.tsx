import Link from "next/link";
import { EmptyState, PageHeader, pillClasses } from "@/components/drishti";
import { LazyAppShell as AppShell } from "@/components/drishti/chrome/LazyAppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl pt-10">
        <PageHeader eyebrow="404" title="That page is not in the atlas." />
        <EmptyState
          bounded
          title="Nothing lives at this address"
          description="The link may be old, or this research surface has not been created yet."
          action={
            <Link href="/" className={pillClasses("ink")}>
              Back to your desk
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
