"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/components/aceternity/motion-utils";
import dynamic from "next/dynamic";

const RequestAccessForm = dynamic(() => import("./RequestAccessForm").then((m) => m.RequestAccessForm), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="min-h-[396px]" />,
});

function CornerMark({ className }: { className: string }) {
  return <Plus aria-hidden="true" strokeWidth={1.25} className={`absolute size-5 bg-[var(--ink-base)] text-fg-secondary ${className}`} />;
}
