"use client";

import { Check, ExternalLink, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/aceternity/motion-utils";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { CHECK_DATE, HERO_FINDINGS } from "./landing-data";

const TODAY = ["Nobody remembers where a number came from", "Nobody can check it", "Screenshots go stale in a deck"] as const;

const STATS = [
  { value: "About 7", label: "searches per brand, shown before you start" },
  { value: "Up to 5", label: "competitors per check" },
  { value: "5", label: "public sources read" },
] as const;
