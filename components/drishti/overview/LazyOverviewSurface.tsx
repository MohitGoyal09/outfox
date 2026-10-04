"use client";

import dynamic from "next/dynamic";

export const LazyOverviewSurface = dynamic(() => import("./OverviewSurface").then((m) => m.OverviewSurface), { ssr: false });
