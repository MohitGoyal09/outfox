"use client";


import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Spinner } from "@/components/ui/spinner";

const WORDS = ["Thinking", "Checking evidence", "Reasoning", "Comparing brands", "Almost there"];
const ROTATE_MS = 1800;

export function ThinkingIndicator() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setIndex((current) => (current + 1) % WORDS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const word = `${WORDS[index]}…`;

  return (
    <p className="flex items-center gap-2 text-sm text-fg-secondary">
      <Spinner className="size-4" />
      {reduceMotion ? (
        <span>{word}</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      )}
    </p>
  );
}
