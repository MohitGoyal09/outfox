"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/aceternity/hero-highlight";
import { MagneticButton } from "@/components/aceternity/magnetic-button";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";
import { cn } from "@/lib/utils";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { HeroBackdrop, useMedia } from "./HeroBackdrop";
import { TrailVisual } from "./TrailVisual";

export const HERO_SUB = "See what your rivals' ads, videos and search results lean on, with every number linked to its source.";

const PIN_QUERY = "(min-width: 1024px) and (min-height: 700px)";
