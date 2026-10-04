"use client";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Fragment, useRef } from "react";

const MIN = 0.15;
const SPAN = 0.8; // word starts are spread over the first 80% of progress
const WIN = 0.2; // each word takes 20% of progress to reach full opacity

function Word({ children, progress, index, count }: { children: string; progress: MotionValue<number>; index: number; count: number }) {
  const start = count <= 1 ? 0 : (index / (count - 1)) * SPAN;
  const end = Math.min(1, start + WIN);
  const opacity = useTransform(progress, (p) => (p <= start ? MIN : p >= end ? 1 : MIN + (1 - MIN) * ((p - start) / (end - start))));
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

export function ScrollWordReveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const words = text.split(" ");

  return (
    <div ref={ref} className={reduced ? "py-16" : "h-[220vh]"}>
      <p className="sr-only">{text}</p>
      <p aria-hidden="true" className={`${reduced ? "" : "sticky top-0 flex h-screen items-center"} ${className}`}>
        <span>
          {words.map((w, i) => (
            <Fragment key={i}>
              {reduced ? <span>{w}</span> : <Word progress={scrollYProgress} index={i} count={words.length}>{w}</Word>}
              {i < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </span>
      </p>
    </div>
  );
}
