"use client";

import { useState } from "react";
import { hookName } from "@/components/drishti/labels";
import { EngineTag } from "@/components/drishti/brands/PlatformLogo";
import { HOOK_COLOR, isHookType } from "@/components/drishti/tokens";
import { CardContainer, CardItem } from "@/components/aceternity/3d-card";
import { AD_CREATIVE, HOOK_MATRIX, HOOK_ORDER, OFF_TOPIC } from "./landing-data";

export function HookTable() {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-raised">
      
    </div>
  );
}

export function OffTopic() {
  const [showing, setShowing] = useState(true);
  const o = OFF_TOPIC;
}
