"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ImageDithering } from "@paper-design/shaders-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { EASE_OUT } from "@/components/aceternity/motion-utils";
import { HERO_INK as INK, PHOTO_PAPER, hasWebGL2 } from "./dither";

const SRC = "/landing/hero-landscape.webp";
const REVEAL_S = 1.4;
const EDGE_VMAX = 9;

export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
