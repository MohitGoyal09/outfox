"use client";


import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, iconProps } from "@/components/drishti";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEP_COUNT, type OnboardingStep } from "./onboarding-model";

export function StepShell({
  step,
  title,
  description,
  onBack,
  children,
}: {
  step: OnboardingStep;
  title: string;
  description: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-[var(--bg,#F6F7F4)] px-4 py-10 sm:py-14">
      <div className="flex w-full max-w-[640px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                icon={<ArrowLeft {...iconProps} size={14} />}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            <ol className="flex items-center gap-1.5" aria-label={`Step ${step} of ${ONBOARDING_STEP_COUNT}`}>
              {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, index) => index + 1).map((dot) => (
                <li
                  key={dot}
                  aria-current={dot === step ? "step" : undefined}
                  className={cn(
                    "h-1.5 rounded-full motion-safe:transition-all motion-safe:duration-200",
                    dot === step
                      ? "w-6 bg-[var(--accent,#0F766E)]"
                      : dot < step
                        ? "w-1.5 bg-[var(--accent,#0F766E)]/50"
                        : "w-1.5 bg-[var(--border-strong,#CBD2DC)]",
                  )}
                />
              ))}
            </ol>
            {/* A way out. Without it the first step was a dead end: a user who
                landed here by mistake -- or who only wanted to add a rival --
                could finish the flow or close the tab, nothing else. */}
            <Link
              href="/"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-150 ease-out hover:bg-bg-inset hover:text-foreground"
            >
              Back to Drishti
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--text-tertiary,#98A2B3)]">
              Step {step} of {ONBOARDING_STEP_COUNT}
            </p>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary,#17191D)]">
              {title}
            </h1>
            <p className="max-w-[52ch] text-[14px] leading-[1.5] text-[var(--text-secondary,#667085)]">
              {description}
            </p>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
