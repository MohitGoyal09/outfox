"use client";

import type { ReactNode } from "react";

import { StatTile as BaseStatTile, type Tone } from "@/components/drishti";

export type StatTileProps = {
  label: string;
  labelInfo?: string;
  value: string | number | null | undefined;
  unit?: string;
  tone?: Tone;
  accent?: Tone;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function StatTile({ accent, icon: _icon, tone, ...rest }: StatTileProps) {
  void _icon;
  return <BaseStatTile {...rest} tone={tone ?? accent} />;
}
