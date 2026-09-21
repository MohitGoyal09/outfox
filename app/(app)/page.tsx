import type { Metadata } from "next";

import { OverviewSurface } from "@/components/drishti/overview/OverviewSurface";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return <OverviewSurface />;
}
