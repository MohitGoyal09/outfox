"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SHOTS = [
  { value: "signals", label: "Signals", src: "/landing/signals.webp", alt: "The Signals page: a table of hook mix by brand, each cell shaded in its hook's colour.", caption: "Hook mix by brand. Which hooks each rival leans on, with the biggest gaps called out." },
  { value: "brand", label: "Brand", src: "/landing/brand.webp", alt: "A brand page for Minimalist: sources, top hooks and stage mix, with when each source was last checked.", caption: "One brand, every source. Search, ads, YouTube, news and demand, each with when it was last checked." },
  { value: "ask", label: "Ask", src: "/landing/ask.webp", alt: "An Ask answer with small numbered chips after each claim.", caption: "Answers with sources. Click any number to see the finding behind it." },
  { value: "board", label: "Board", src: "/landing/board.webp", alt: "A board with four columns of saved evidence cards: hooks, offers, creatives, things to test.", caption: "Your swipe file. Pin real evidence into columns: hooks, offers, creatives, things to test." },
] as const;
