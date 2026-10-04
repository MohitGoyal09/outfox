"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { cn } from "@/lib/utils";
import { SOURCES } from "./landing-data";

const listClass = "flex shrink-0 list-none items-center gap-4 p-0 pr-4 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:pr-0";
