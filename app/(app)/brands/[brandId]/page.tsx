"use client";


import { use } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";

import { BrandProfile } from "@/components/drishti/brands/BrandProfile";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import { EmptyState } from "@/components/drishti/EmptyState";
import { pillClasses } from "@/components/drishti/PillButton";
import { iconProps } from "@/components/drishti/tokens";
import type { Id } from "@/convex/_generated/dataModel";

const BRAND_ID_RE = /^[a-z0-9]{32}$/;

export default function BrandProfilePage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = use(params);
  const decoded = decodeURIComponent(brandId ?? "");

  if (decoded === "" || !BRAND_ID_RE.test(decoded)) {
    return (
      <EmptyState
        bounded
        icon={<Tag {...iconProps} size={16} />}
        title="This brand address is not valid."
        description="A brand profile lives at /brands/ followed by the brand's id. Open the brand list and pick a tracked rival from there."
        action={
          <Link href="/brands" className={pillClasses("outline", "sm")}>
            All brands
          </Link>
        }
      />
    );
  }

  return (
    <QueryBoundary label="This brand profile">
      <BrandProfile brandId={decoded as Id<"brands">} />
    </QueryBoundary>
  );
}
