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
