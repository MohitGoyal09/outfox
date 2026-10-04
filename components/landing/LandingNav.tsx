"use client";

import Link from "next/link";
import { DrishtiMark } from "@/components/drishti/chrome/DrishtiMark";
import { Button } from "@/components/ui/button";
import { MovingBorder } from "@/components/aceternity/moving-border";
import { MobileMenu, NavBody, NavItems, Navbar, mobileItemClass } from "@/components/aceternity/resizable-navbar";
import { RequestAccessDialog } from "./RequestAccessDialog";

const LINKS = [
  { link: "#how-it-works", name: "How it works" },
  { link: "#product", name: "Product" },
  { link: "#limits", name: "What we will not claim" },
  { link: "#faq", name: "FAQ" },
] as const;

export function LandingNav() {
  return (
    <Navbar>
      
    </Navbar>
  );
}
