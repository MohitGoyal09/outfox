"use client";

import { useEffect } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { EASE_OUT } from "./motion-utils";

export function TextGenerateEffect({ words, className, delay = 0.15 }: { words: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (reduce) return;
    animate("span", { opacity: 1, filter: "blur(0px)" }, { duration: 0.45, ease: EASE_OUT, delay: stagger(0.024, { startDelay: delay }) });
  }, [animate, reduce, delay]);

  return (
    <p ref={scope} className={className}>
      {words.split(" ").map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={reduce ? false : { opacity: 0, filter: "blur(4px)" }}
        >
          {word}
          {" "}
        </motion.span>
      ))}
    </p>
  );
}
