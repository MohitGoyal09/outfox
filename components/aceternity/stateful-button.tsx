"use client";

import type { ComponentProps } from "react";
import { SubmitButton, type SubmitStatus } from "@/components/ui/form";

export type ButtonStatus = SubmitStatus;

export function StatefulButton({
  idleLabel,
  pendingLabel,
  successLabel,
  ...props
}: { idleLabel: string; pendingLabel: string; successLabel: string } & ComponentProps<typeof SubmitButton>) {
  return <SubmitButton {...props} labels={{ idle: idleLabel, pending: pendingLabel, success: successLabel }} />;
}
