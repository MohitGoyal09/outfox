"use client";

import { useEffect, useState } from "react";
import { ImageDithering } from "@paper-design/shaders-react";
import { HERO_INK as INK, PHOTO_PAPER, hasWebGL2 } from "./dither";

const SRC = "/landing/hero-landscape.webp";

export function HeroBackdrop() {
  const [state, setState] = useState<"shader" | "css" | null>(null);

  useEffect(() => {
    let live = true;
    img.src = SRC;
    return () => {
      live = false;
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#FAF4EE]">
      
      {state === "css" ? (
        <img src={SRC} alt="" className="l-backdrop-in absolute inset-0 size-full object-cover opacity-50 [object-position:35%_100%] [filter:grayscale(1)_contrast(1.1)]" />
      ) : null}
    </div>
  );
}
