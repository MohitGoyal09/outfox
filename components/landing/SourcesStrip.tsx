import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { SOURCES } from "./landing-data";

export function SourcesStrip() {
  return (
    <section aria-labelledby="sources-heading" className="border-y border-border bg-bg-raised">
      <div className="l-wrap py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
          <h2 id="sources-heading" className="l-label shrink-0 lg:w-40">
            Read from public sources
          </h2>
          <ul className="grid flex-1 list-none grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
            
          </ul>
        </div>
        <p className="mt-6 text-[13px] text-fg-tertiary lg:ml-52">
          Public data only. Ad presence is not ad spend. Trends is relative interest, not sales.
        </p>
      </div>
    </section>
  );
}
