"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "motion/react";
import { Dithering, ImageDithering } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";
import { PALETTE_FALLBACK, tintOnPaper, hasWebGL2, readPalette } from "./dither";

type PlateProps = {
  children: ReactNode;
  className?: string;
  seed?: number;
  image?: string;
  tint?: string;
};
