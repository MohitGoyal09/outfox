"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, RotateCcw } from "lucide-react";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { hookName } from "@/components/drishti/labels";
import { EASE_OUT, useReducedMotion } from "@/components/aceternity/motion-utils";
import { CHECK_DATE, HOOK_MATRIX, SOURCES, SUGAR_LONGEST_AD } from "./landing-data";

type Part = string | number;
type Source = { engine: string; label: string; meta: string; href?: string };
type Answer = { question: string; short: string; parts: readonly Part[]; sources: readonly Source[] };

const pct = (n: number, total: number) => Math.round((n / total) * 100);

const ANSWERS = buildAnswers();
const WORD_MS = 42;
const ROTATE_MS = 3200;

function plain(parts: readonly Part[]) {
  return parts.map((p) => (typeof p === "string" ? p : "")).join("");
}

function TypedAnswer({ parts, instant, onDone }: { parts: readonly Part[]; instant: boolean; onDone: () => void }) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (shown >= tokens.length) {
      done.current();
      return;
    }
    const t = window.setTimeout(() => setShown((n) => n + 1), WORD_MS);
    return () => window.clearTimeout(t);
  }, [shown, tokens.length]);
  return (
    <>
      <p className="sr-only" role="status">{plain(parts)}</p>
      <p aria-hidden="true" className="text-[1.0625rem] leading-[1.65] text-fg">
        {tokens.slice(0, shown).map((t, i) =>
          typeof t === "number" ? (
            <motion.sup key={i} initial={instant ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="num mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-border bg-bg-inset px-1 align-[0.1em] text-[11px] font-normal text-fg-secondary">
              {t}
            </motion.sup>
          ) : (
            <span key={i}>{t}</span>
          ),
        )}
        {shown < tokens.length ? <span className="ml-0.5 inline-block h-[1.1em] w-px translate-y-[0.2em] animate-pulse bg-fg" /> : null}
      </p>
    </>
  );
}

function SourceRow({ s, i }: { s: Source; i: number }) {
  const inner = (
    <>
      <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-border bg-bg-inset px-1 text-[11px] text-fg-secondary">{i + 1}</span>
      <PlatformLogo engine={s.engine} className="size-4" />
      <span className="min-w-0 flex-1 truncate text-left">{s.label}</span>
      <span className="num shrink-0 text-fg-secondary">{s.meta}</span>
    </>
  );
  return s.href ? (
    <a href={s.href} target="_blank" rel="noopener noreferrer" className={`${cls} transition-colors duration-150 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function AskBox() {
  const answers = ANSWERS;
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [typed, setTyped] = useState(false);

  useEffect(() => {
    if (reduce || value || active) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % answers.length), ROTATE_MS);
    return () => window.clearInterval(t);
  }, [reduce, value, active, answers.length]);

  const play = (answer: Answer, custom = false) => {
    setTyped(false);
    setActive({ answer, custom });
  };

  const submit = (e: FormEvent) => {
    const hit = answers.find((a) => (q.includes("longest") || q.includes("sugar")) && a.question.includes("SUGAR")) ?? answers.find((a) => (q.includes("hook") || q.includes("mamaearth")) && a.question.includes("Mamaearth")) ?? answers.find((a) => (q.includes("discount") || q.includes("offer")) && a.question.includes("discount"));
    play(hit ?? answers[idx], !hit);
  };

  const chips = answers.map((a) => (
    <button key={a.question} type="button" title={a.question} onClick={() => { setValue(""); play(a); }} className="cursor-pointer whitespace-nowrap rounded-full border border-border-strong bg-white px-2.5 py-1 text-[12px] text-fg-secondary transition-colors duration-150 hover:border-fg-tertiary hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      {a.short}
    </button>
  ));

  return (
    <div className="mx-auto w-full max-w-[56rem]">
      <motion.div layout transition={{ layout: { duration: reduce ? 0 : 0.4, ease: EASE_OUT } }} style={{ borderRadius: 24 }} className="mx-auto max-w-[42rem] overflow-hidden border border-border-strong bg-white text-left shadow-[0_18px_50px_-24px_rgba(17,17,19,0.35)]">
        
      </motion.div>
      {active ? null : <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:hidden">{chips}</div>}
    </div>
  );
}
