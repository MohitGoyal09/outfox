"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/components/aceternity/motion-utils";
import { RequestAccessForm } from "./RequestAccessForm";

function CornerMark({ className }: { className: string }) {
  return <Plus aria-hidden="true" strokeWidth={1.25} className={`absolute size-5 bg-[var(--ink-base)] text-fg-secondary ${className}`} />;
}
