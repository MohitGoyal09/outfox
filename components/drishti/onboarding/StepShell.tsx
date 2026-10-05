"use client";


import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, pillClasses, iconProps } from "@/components/drishti";
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
    <main className="flex bg-bg-raised-2 min-h-dvh flex-col items-center px-4 py-10 sm:py-14">
      <div className="flex w-full max-w-[640px] flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            {onBack ? (
              <button type="button" onClick={onBack} className={pillClasses("outline", "sm")}>
                <ArrowLeft {...iconProps} size={14} aria-hidden="true" />
                Back
              </button>
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
                      ? "w-6 bg-accent"
                      : dot < step
                        ? "w-1.5 bg-accent/50"
                        : "w-1.5 bg-border-strong",
                  )}
                />
              ))}
            </ol>
            {/* A way out. Without it the first step was a dead end: a user who
                landed here by mistake -- or who only wanted to add a rival --
                could finish the flow or close the tab, nothing else. */}
            <Link
              href="/"
              className="rounded-md px-2 py-1 text-xs text-fg-secondary transition-colors duration-150 ease-out hover:bg-bg-inset hover:text-fg"
            >
              Back to Drishti
            </Link>
          </div>
          <PageHeader
            eyebrow={`Step ${step} of ${ONBOARDING_STEP_COUNT}`}
            title={title}
            sub={description}
            className="pb-0"
          />
        </div>
        {children}
      </div>
    </main>
  );
}
