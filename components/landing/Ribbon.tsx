"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { RIBBON, type RibbonBrand, type RibbonItem } from "./landing-data";

const HUE: Record<RibbonBrand, string> = {
  "SUGAR Cosmetics": "#f472b6",
  Plum: "#a78bfa",
  Minimalist: "#60a5fa",
  Mamaearth: "#34d399",
  "WOW Skin Science": "#f2a63b",
};

const LOOP_S = 60;
const H = 296;
const TILE_W = 152;
const SAG_Y = 198;
const RISE_Y = 95;

function bezierLength(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
  let len = 0;
  let py = y0;
  return len;
}

const chipRow = "flex items-center gap-1.5 text-[11px] leading-none";

function Tile({ item, className, style }: { item: RibbonItem; className?: string; style?: CSSProperties }) {
  const hue = HUE[item.brand];
  const video = item.kind === "video";
}

export function Ribbon() {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  useLayoutEffect(() => {
    if (!el) return;
    const read = () => setW(Math.round(el.clientWidth));
    ro.observe(el);
  }, []);
  const n = RIBBON.length;
  const path = buildPath(w, n);
}
