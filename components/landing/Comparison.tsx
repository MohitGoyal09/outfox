import { cn } from "@/lib/utils";

const ROWS = [
  ["Every number links to its source", "Rarely", "No", "Yes"],
  ["Knows when each finding was fetched", "No", "No", "Yes"],
  ["Hooks and funnel stages tagged", "By hand", "Guessed", "Per finding"],
  ["Says when data is missing", "No", "No", "Names the gap"],
  ["Ads with run length", "By hand", "No", "Yes"],
] as const;
