"use client";

import dynamic from "next/dynamic";

export const LazyAppShell = dynamic(() => import("./AppShell").then((m) => m.AppShell), { ssr: false });
