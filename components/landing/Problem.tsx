"use client";

import { Check, ExternalLink, X } from "lucide-react";
import { motion } from "motion/react";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { HERO_FINDINGS } from "./landing-data";
import { SectionCaption } from "./SectionCaption";

const TODAY = ["Nobody remembers where a number came from", "Nobody can check it", "Screenshots go stale in a deck"] as const;
