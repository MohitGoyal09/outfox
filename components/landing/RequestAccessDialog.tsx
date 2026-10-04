"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestAccessForm } from "./RequestAccessForm";

export function RequestAccessDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
}
