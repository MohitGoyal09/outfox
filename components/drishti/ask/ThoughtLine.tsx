"use client";


import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { ChevronDown, ListChecks } from "lucide-react";
import { iconProps } from "../tokens";
import { stripEmDashes } from "@/lib/noEmDash";
import { ThinkingOrb } from "./ThinkingOrb";
import { PlatformLogo } from "../brands/PlatformLogo";
import "./thought-line.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
const GLYPH_DONE = 0.55;
const EMPTY_STEPS: ThoughtStep[] = [];

export type ThoughtStepStatus = "running" | "complete" | "failed";

export type ThoughtStep = {
  id: string;
  text: string;
  status: ThoughtStepStatus;
  engine?: string | null;
};

function foldSteps(steps: ThoughtStep[]): { step: ThoughtStep; index: number; count: number }[] {
  const rows: { step: ThoughtStep; index: number; count: number }[] = [];
  steps.forEach((step, index) => {
    const prev = rows[rows.length - 1];
    if (prev && prev.step.text === step.text && prev.step.status === step.status && prev.step.engine === step.engine) {
      rows[rows.length - 1] = { step, index, count: prev.count + 1 };
    } else {
      rows.push({ step, index, count: 1 });
    }
  });
  return rows;
}

function formatElapsed(deciseconds: number): string {
  if (deciseconds < 600) return `${(deciseconds / 10).toFixed(1)}s`;
  return `${Math.floor(deciseconds / 600)}m ${((deciseconds % 600) / 10).toFixed(1)}s`;
}

export function ThoughtLine({
  steps = EMPTY_STEPS,
  working,
  elapsedSeconds,
  showTimer = true,
  color = "var(--text-secondary)",
  glyphColor = "var(--text-tertiary)",
  fontSize = 13,
  settleDuration = 250,
  shimmerDuration = 1.4,
  breathPeriod = 1.6,
  breathDepth = 0.45,
  className = "",
}: {
  steps?: ThoughtStep[];
  working: boolean;
  elapsedSeconds?: number | null;
  showTimer?: boolean;
  color?: string;
  glyphColor?: string;
  fontSize?: number;
  settleDuration?: number;
  shimmerDuration?: number;
  breathPeriod?: number;
  breathDepth?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const stepCount = steps.length;
  const failedCount = steps.filter((step) => step.status === "failed").length;
  const stepWord = stepCount === 1 ? "step" : "steps";
  const settledSummary =
    failedCount > 0
      ? `Thought through ${stepCount} ${stepWord} · ${failedCount} failed`
      : `Thought through ${stepCount} ${stepWord}`;
  const currentStep = steps[stepCount - 1];
  const workingSummary = currentStep ? `${stripEmDashes(currentStep.text)}…` : "Thinking…";

  const [autoSettled, setAutoSettled] = useState(false);
  const [open, setOpen] = useState(working);
  const [announce, setAnnounce] = useState(working ? workingSummary : settledSummary);
  const [frozenDeciseconds, setFrozenDeciseconds] = useState<number | null>(null);
  const dsRef = useRef(0);

  const [prevWorkingProp, setPrevWorkingProp] = useState(working);
  if (working !== prevWorkingProp) {
    setPrevWorkingProp(working);
    if (working) setAutoSettled(false);
  }

  const isWorking = working && !autoSettled;
  const hasTrace = steps.length > 0;
  const depth = reduce ? Math.min(breathDepth, 0.2) : breathDepth;
  const period = reduce ? breathPeriod * 1.5 : breathPeriod;
  const trough = 1 - depth;
  const sheen = !reduce;

  const [prevIsWorking, setPrevIsWorking] = useState(isWorking);
  if (isWorking !== prevIsWorking) {
    setPrevIsWorking(isWorking);
    setOpen(isWorking);
    setAnnounce(isWorking ? workingSummary : settledSummary);
  }

  const glyphRef = useRef<HTMLSpanElement | null>(null);
  const breathRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<HTMLSpanElement | null>(null);
  const stackRef = useRef<HTMLSpanElement | null>(null);
  const workRef = useRef<HTMLSpanElement | null>(null);
  const doneRef = useRef<HTMLSpanElement | null>(null);
  const prevWorking = useRef(isWorking);

  useEffect(() => {
    const glyphEl = glyphRef.current;
    const breathEl = breathRef.current;
    if (!breathEl) return undefined;
    const s = settleDuration / 1000;
    const loop = (el: HTMLElement, delay: number) =>
      animate(el, { opacity: [trough, 1, trough] }, { duration: period, ease: EASE_IN_OUT, repeat: Infinity, delay });
    let cancelled = false;
    const running: { stop: () => void }[] = [];
    if (isWorking) {
      if (depth > 0) {
        if (sheen) running.push(animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
        if (glyphEl) {
          const lead = animate(glyphEl, { opacity: trough }, { duration: 0.2, ease: EASE_OUT });
          running.push(lead);
          void lead.then(() => {
            if (cancelled) return;
            running.push(loop(glyphEl, 0));
            if (!sheen) running.push(loop(breathEl, 0.14));
          });
        } else if (!sheen) {
          running.push(loop(breathEl, 0.14));
        }
      } else {
        if (glyphEl) running.push(animate(glyphEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
        running.push(animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
      }
    } else {
      if (glyphEl) running.push(animate(glyphEl, { opacity: GLYPH_DONE }, { duration: s, ease: EASE_OUT }));
      running.push(animate(breathEl, { opacity: 1 }, { duration: s, ease: EASE_OUT }));
    }
    return () => {
      cancelled = true;
      for (const a of running) a.stop();
    };
  }, [isWorking, period, depth, trough, settleDuration, sheen]);

  const paint = (deciseconds: number) => {
    dsRef.current = deciseconds;
    if (timerRef.current) timerRef.current.textContent = formatElapsed(deciseconds);
  };

  useLayoutEffect(() => {
    if (!isWorking) {
      if (elapsedSeconds !== undefined && elapsedSeconds !== null) {
        paint(Math.round(elapsedSeconds * 10));
        return undefined;
      }
      setFrozenDeciseconds(dsRef.current);
      return undefined;
    }
    setFrozenDeciseconds(null);
    const startedAt = performance.now();
    paint(0);
    const id = setInterval(() => {
      paint(Math.floor((performance.now() - startedAt) / 100));
    }, 100);
    return () => clearInterval(id);
  }, [isWorking]);

  useLayoutEffect(() => {
    const t = timerRef.current;
    const stack = stackRef.current;
    if (!t || !stack) return undefined;
    const place = (glide: boolean) => {
      const active = isWorking ? workRef.current : doneRef.current;
      if (!active) return;
      const shift = active.offsetWidth - stack.offsetWidth;
      if (!glide) t.style.transition = "none";
      t.style.transform = `translateX(${shift}px)`;
      if (!glide) {
        void t.offsetWidth;
        t.style.transition = "";
      }
    };
    place(prevWorking.current !== isWorking);
    prevWorking.current = isWorking;
    const ro = new ResizeObserver(() => place(false));
    if (workRef.current) ro.observe(workRef.current);
    if (doneRef.current) ro.observe(doneRef.current);
    return () => ro.disconnect();
  }, [isWorking, fontSize]);

  const settledDeciseconds =
    elapsedSeconds !== undefined && elapsedSeconds !== null
      ? Math.round(elapsedSeconds * 10)
      : frozenDeciseconds;
  const settledText =
    settledDeciseconds !== null && settledDeciseconds > 0 ? formatElapsed(settledDeciseconds) : "";

  const toggle = hasTrace;

  const head = (
    <>
      {/* The one live orb for this turn: mounted only while working, so a
          settled turn holds no canvas. The sparkle glyph hides meanwhile. */}
      {isWorking ? (
        <span className="thought-line__orb" aria-hidden="true">
          <ThinkingOrb size={20} state="thinking" />
        </span>
      ) : null}
      <span ref={glyphRef} className="thought-line__glyph" aria-hidden="true">
        <ListChecks {...iconProps} />
      </span>
      <span ref={stackRef} className="thought-line__label" aria-hidden="true">
        <span ref={workRef} className="thought-line__text" data-active={isWorking ? "" : undefined}>
          <span ref={breathRef} className="thought-line__breath" data-shimmer={sheen ? "" : undefined}>
            {workingSummary}
          </span>
        </span>
        <span
          ref={doneRef}
          className="thought-line__text thought-line__text--done"
          data-active={isWorking ? undefined : ""}
        >
          {settledSummary}
        </span>
      </span>
      {/* Mounted for the whole live turn (working through settled) so the
          settle transition never unmounts and re-mounts this node -- that
          remount was the earlier bug (see `paint`/`dsRef` above) and it would
          also lose the timer's own `translateX` placement, which only gets
          recomputed when this effect's deps change, not on every render.
          Never shows a measured-looking value it does not have: `paint`
          blanks the text when nothing was measured, and `showTimer` itself
          is false for a persisted turn with no recorded duration. Also stays
          mounted once `frozenDeciseconds` holds a real self-measured value
          even if the caller's `showTimer` has already dropped back to false
          by settle time (a turn stopped or that errored before ever going
          live) -- otherwise the timer would vanish while the settled summary
          still stood, the dangling-measurement bug this line exists to
          avoid. */}
      {showTimer || frozenDeciseconds !== null ? (
        <span ref={timerRef} className="thought-line__timer" data-done={isWorking ? undefined : ""} aria-hidden="true">
          {isWorking ? "0.0s" : settledText}
        </span>
      ) : null}
      <span className="thought-line__chevron" data-on={hasTrace ? "" : undefined} aria-hidden="true">
        <ChevronDown {...iconProps} />
      </span>
      <span className="thought-line__sr" role="status">
        {announce}
      </span>
    </>
  );

  if (steps.length === 0 && !working) return null;

  return (
    <div
      className={`thought-line${className ? ` ${className}` : ""}`}
      data-working={isWorking ? "" : undefined}
      data-open={open && hasTrace ? "" : undefined}
      style={
        {
          "--tl-font": `${fontSize}px`,
          "--tl-color": color,
          "--tl-glyph": glyphColor,
          "--tl-settle": `${settleDuration}ms`,
          "--tl-shimmer": `${shimmerDuration}s`,
        } as CSSProperties
      }
    >
      <button
        type="button"
        className="thought-line__head"
        data-toggle={toggle ? "" : undefined}
        aria-expanded={toggle ? open : undefined}
        tabIndex={toggle ? 0 : -1}
        onClick={() => {
          if (toggle) setOpen((v) => !v);
        }}
      >
        {head}
      </button>
      <div className="thought-line__trace" data-open={open ? "" : undefined} aria-hidden={!open}>
        <div className="thought-line__fold">
          <div className="thought-line__steps">
            {foldSteps(steps).map(({ step, index, count }) => {
              const done = step.status === "complete" || (step.status === "running" && index < steps.length - 1);
              const failed = step.status === "failed";
              const running = !done && !failed;
              return (
                <div
                  key={step.id}
                  className="thought-line__step"
                  data-done={done && !failed ? "" : undefined}
                  data-failed={failed ? "" : undefined}
                  data-running={running ? "" : undefined}
                >
                  <span className="thought-line__mark" aria-hidden="true">
                    <i className="thought-line__dot" />
                  </span>
                  {step.engine ? <PlatformLogo engine={step.engine} className="size-3.5" /> : null}
                  <span className="thought-line__step-text">
                    {stripEmDashes(step.text)}
                    {count > 1 ? <span className="thought-line__count"> ×{count}</span> : null}
                  </span>
                  {/* The dot's shape and hue are the visual status cue; this
                      is the same state for a screen reader, since the mark
                      itself is aria-hidden. */}
                  <span className="thought-line__sr">
                    {failed ? "failed" : done ? "complete" : "running"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
