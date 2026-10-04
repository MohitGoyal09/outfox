"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "motion/react";
import { Dithering, ImageDithering } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";

const HEX6 = /^#[0-9a-f]{6}$/i;
const FALLBACK = { paper: "#f6f7f4", ink: "#15171b" };

function hasWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

type PlateProps = {
  children: ReactNode;
  className?: string;
  seed?: number;
  image?: string;
};

export function Plate({ children, className, seed = 0, image }: PlateProps) {
  const near = useInView(ref, { once: true, margin: "300px 0px" });
  const [palette, setPalette] = useState<typeof FALLBACK | null>(null);

  useEffect(() => {
    if (!near || !hasWebGL2()) return;
    const raf = requestAnimationFrame(() => setPalette(readPalette()));
    return () => cancelAnimationFrame(raf);
  }, [near]);

  const shared = {
    speed: 0,
    minPixelRatio: 1,
    maxPixelCount: 1_600_000,
    colorBack: palette?.paper,
    className: "absolute inset-0 size-full",
  } as const;
  const front = palette ? `${palette.ink}12` : undefined;
}
