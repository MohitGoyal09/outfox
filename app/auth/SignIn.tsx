"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AlertCircle, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DrishtiMark } from "@/components/drishti/chrome/DrishtiMark";
import { EvidenceTrail } from "./EvidenceTrail";
import {
  type ResetStep,
  canResend,
  mapResetError,
  nextStep,
  validateEmail,
  validateResetForm,
  RESEND_COOLDOWN_SECONDS, revealSendError } from "./reset-model";

const linkClass =
  "rounded-sm text-sm text-fg-secondary underline decoration-border-strong underline-offset-4 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50";


const SIGNUP_ENABLED = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isResetting || sentAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isResetting, sentAt]);

  const secondsSinceSend = sentAt === null ? 0 : Math.floor((now - sentAt) / 1000);

  function leaveReset() {
    setError(null);
    setIsResetting(false);
    setResetStep("email");
    setCode("");
    setNewPassword("");
    setSentAt(null);
  }

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const invalid = validateEmail(email);
    if (invalid) return setError(invalid);
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { email: email.trim(), flow: "reset" });
    } catch (cause) {
      const mapped = mapResetError(cause, "send");
      if (revealSendError(mapped, process.env.NODE_ENV === "production")) {
        setError(mapped);
        setIsSubmitting(false);
        return;
      }
    }
    setResetStep((step) => nextStep(step, "codeSent"));
    setSentAt(Date.now());
    setNow(Date.now());
    setIsSubmitting(false);
  }

  async function verifyReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateResetForm(code, newPassword);
    if (invalid) return setError(invalid);
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", {
        email: email.trim(),
        code: code.trim(),
        newPassword,
        flow: "reset-verification",
      });
    } catch (cause) {
      setError(mapResetError(cause, "verify"));
      setIsSubmitting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn("password", {
        flow: mode,
        email,
        password,
        ...(mode === "signUp" ? { name } : {}),
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(/Sign-up is closed/.test(message) ? "Sign-up is closed. Ask the workspace owner for an account." : message || "Unable to sign in.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-bg-raised text-fg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section
        aria-labelledby="signin-heading"
        className="relative hidden flex-col justify-between overflow-hidden bg-accent p-12 text-accent-ink lg:flex xl:p-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom right, black 20%, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom right, black 20%, transparent 85%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent-ink text-accent">
            <DrishtiMark size={24} />
          </span>
          <div>
            <p className="font-semibold tracking-tight">Drishti</p>
            <p className="text-[12px] font-medium text-accent-ink/55">
              Evidence atlas
            </p>
          </div>
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-ink/55">
            Research desk
          </p>
          <h1
            id="signin-heading"
            className="mt-4 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] xl:text-6xl"
          >
            See the trail behind every claim.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-accent-ink/65">
            Compare brands with public signals that stay inspectable from first search to final brief.
          </p>
          <div className="mt-12">
            <EvidenceTrail />
          </div>
        </div>
        <div className="relative flex flex-wrap gap-x-8 gap-y-3 text-sm text-accent-ink/60">
          <p className="flex items-center gap-2">
            <Check className="size-4 text-accent-ink/80" /> Search, ads, creator and demand signals
          </p>
          <p className="flex items-center gap-2">
            <Check className="size-4 text-accent-ink/80" /> Evidence stored with provenance
          </p>
          <p className="flex items-center gap-2">
            <Check className="size-4 text-accent-ink/80" /> Answers grounded in your research
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-ink">
              <DrishtiMark size={22} />
            </span>
            <p className="font-semibold tracking-tight">Drishti</p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-tertiary">
            Private research desk
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[2.75rem]">
            {isResetting ? "Reset your password" : mode === "signIn" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-4 text-base leading-7 text-fg-secondary">
            {isResetting
              ? resetStep === "email"
                ? "Enter your email and we will send an 8-digit code."
                : "If an account exists for that email, we sent it a code. Enter it and choose a new password."
              : mode === "signIn"
              ? "Continue your brand research with the evidence still attached."
              : "Start a private evidence desk for the brands you follow."}
          </p>
          {isResetting ? (
            <>
              {resetStep === "email" ? (
                <form className="mt-10 space-y-6" onSubmit={sendCode}>
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="reset-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-12 rounded-lg px-4 text-base"
              />
            </div>
            {error ? (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="group h-12 w-full justify-between rounded-lg bg-accent px-5 text-base text-accent-ink hover:bg-accent-strong"
            >
              <span>{isSubmitting ? "Working…" : "Send code"}</span>
              <ArrowRight className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
            </Button>
                </form>
              ) : (
                <form className="mt-10 space-y-6" onSubmit={verifyReset}>
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="reset-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                readOnly
                placeholder="you@company.com"
                className="h-12 rounded-lg px-4 text-base"
              />
            </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-code" className="text-sm font-medium">
                      Code
                    </Label>
                    <Input
                      id="reset-code"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{8}"
                      maxLength={8}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                      placeholder="8-digit code"
                      className="h-12 rounded-lg px-4 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-new-password" className="text-sm font-medium">
                      New password
                    </Label>
                    <Input
                      id="reset-new-password"
                      required
                      minLength={8}
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      className="h-12 rounded-lg px-4 text-base"
                    />
                  </div>
            {error ? (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="group h-12 w-full justify-between rounded-lg bg-accent px-5 text-base text-accent-ink hover:bg-accent-strong"
            >
              <span>{isSubmitting ? "Working…" : "Reset password"}</span>
              <ArrowRight className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
            </Button>
                </form>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {resetStep === "code" ? (
                  <button
                    type="button"
                    className={linkClass}
                    disabled={isSubmitting || !canResend(secondsSinceSend)}
                    onClick={() => void sendCode()}
                  >
                    {canResend(secondsSinceSend)
                      ? "Resend code"
                      : `Resend code in ${RESEND_COOLDOWN_SECONDS - secondsSinceSend}s`}
                  </button>
                ) : null}
                <button type="button" className={linkClass} disabled={isSubmitting} onClick={leaveReset}>
                  Back to sign in
                </button>
              </div>
            </>
          ) : (
            <>
          <form className="mt-10 space-y-6" onSubmit={submit}>
            {mode === "signUp" ? (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="h-12 rounded-lg px-4 text-base"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-12 rounded-lg px-4 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                required
                minLength={8}
                type="password"
                autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="h-12 rounded-lg px-4 text-base"
              />
              {mode === "signIn" ? (
                <button
                  type="button"
                  className={linkClass}
                  onClick={() => {
                    setError(null);
                    setIsResetting(true);
                  }}
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
            {error ? (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="group h-12 w-full justify-between rounded-lg bg-accent px-5 text-base text-accent-ink hover:bg-accent-strong"
            >
              <span>{isSubmitting ? "Working…" : mode === "signIn" ? "Sign in" : "Create account"}</span>
              <ArrowRight className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
            </Button>
          </form>
          {SIGNUP_ENABLED ? (
            <button
              type="button"
              className={`mt-8 ${linkClass}`}
              onClick={() => {
                setError(null);
                setMode(mode === "signIn" ? "signUp" : "signIn");
              }}
            >
              {mode === "signIn" ? "Need an account? Create one" : "Already have an account? Sign in"}
            </button>
          ) : null}
            </>
          )}
          <p className="mt-12 flex items-center gap-2 border-t border-border pt-6 text-xs text-fg-tertiary">
            <ShieldCheck className="size-3.5" /> Your workspace is private by default.
          </p>
        </div>
      </section>
    </main>
  );
}
