"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "motion/react";
import { Dithering, ImageDithering } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";
import { PALETTE_FALLBACK, hasWebGL2, readPalette } from "./dither";

const WHITE = 255;
function tintOnPaper(hue: string, amount: number) {
  const mix = (i: number) => Math.round(WHITE * (1 - amount) + parseInt(hue.slice(1 + i * 2, 3 + i * 2), 16) * amount);
}

type PlateProps = {
  children: ReactNode;
  className?: string;
  seed?: number;
  image?: string;
  tint?: string;
};
