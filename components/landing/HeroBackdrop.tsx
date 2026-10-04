"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ImageDithering } from "@paper-design/shaders-react";
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
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

export function HeroBackdrop({ progress, scrollLinked = false }: { progress?: MotionValue<number>; scrollLinked?: boolean }) {
  const [state, setState] = useState<"shader" | "css" | null>(null);
  const reduce = useReducedMotion();
  const fallbackProgress = useMotionValue(0);
  const reveal = useMotionValue(0);

  useEffect(() => {
    let live = true;
    img.src = SRC;
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (state === null) return;
    const c = animate(reveal, REVEAL_END, { duration: REVEAL_S, ease: EASE_OUT });
    return () => c.stop();
  }, [state, reduce, reveal]);
  const inset = useTransform(p, [0, 0.55], [0, 36]);
  const scale = useTransform(p, [0, 0.55], [1.1, 1]);

  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={scrollLinked ? { clipPath: clip, WebkitClipPath: clip } : undefined}>
      <motion.div className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <motion.div className="absolute inset-0 origin-[36%_78%]" style={scrollLinked ? { scale } : undefined}>
          {state === "shader" ? (
            <ImageDithering
              image={SRC}
              speed={0}
              minPixelRatio={1}
              maxPixelCount={4_000_000}
              colorBack={INK}
              colorFront={PHOTO_PAPER}
              colorHighlight={PHOTO_PAPER}
              originalColors={false}
              colorSteps={2}
              type="4x4"
              size={3}
              fit="cover"
              originX={0.35}
              originY={1}
              className="absolute inset-0 size-full"
            />
          ) : null}
          {state === "css" ? (
            <img src={SRC} alt="" className="absolute inset-0 size-full object-cover opacity-50 [object-position:35%_100%] [filter:grayscale(1)_contrast(1.1)]" />
          ) : null}
        </motion.div>
      </motion.div>
      {scrollLinked ? <motion.div className="absolute inset-0 bg-bg" style={{ opacity: veil }} /> : null}
    </motion.div>
  );
}
