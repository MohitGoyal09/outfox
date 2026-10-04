"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { hookName } from "@/components/drishti/labels";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { HERO_FINDINGS } from "./landing-data";

type Props = {
  brand: string;
  hook: string;
  count: number;
  total: number;
  share: number;
  fill?: string;
  pos: string;
  tabbable: boolean;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  onFocusCell: () => void;
};
const GAP = 8;

export function HookCell({ brand, hook, count, total, share, fill, pos, tabbable, onKeyDown, onFocusCell }: Props) {
  const label = hookName(hook);
  const found = HERO_FINDINGS.find((f) => f.brand === brand && f.hook === label);

  const open = () => {
    const el = btn.current;
    if (!el) return;
    const left = Math.max(12, Math.min(r.left + r.width / 2 - POP_W / 2, window.innerWidth - POP_W - 12));
    const up = r.bottom + GAP + 220 > window.innerHeight;
    setAt({ top: up ? r.top - GAP : r.bottom + GAP, up, left, root: el.closest(".l-theme") ?? document.body });
  };

  useEffect(() => {
    if (!at) return;
    window.addEventListener("scroll", close, { passive: true });
  }, [at]);

  return (
    <td className="num p-0 text-right" style={{ backgroundColor: fill }}>
      
      
    </td>
  );
}
