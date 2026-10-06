"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestAccessForm } from "./RequestAccessForm";

export function RequestAccessDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      
      <DialogContent className="data-open:animate-[l-modal-in_200ms_cubic-bezier(0.22,1,0.36,1)]!">
        <DialogHeader>
          <DialogTitle>Request access</DialogTitle>
          <DialogDescription>Outfox is invite-only for now. Tell us who you are and we will set up your workspace.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <RequestAccessForm onDone={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
