"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, SubmitButton } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DrishtiMark } from "@/components/drishti/chrome/DrishtiMark";
import {
  type ResetStep,
  canResend,
  mapResetError,
  nextStep,
  validateEmail,
  validateResetForm,
  RESEND_COOLDOWN_SECONDS, revealSendError } from "./reset-model";

const linkClass =
  "rounded-sm text-[13px] text-fg-secondary underline decoration-border-strong underline-offset-4 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50";


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

  const errorAlert = error ? (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="size-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null;
  const pending = isSubmitting ? "pending" : "idle";

  return (
    <main className="l-theme relative flex min-h-dvh items-center justify-center px-4 py-12 text-fg">
      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-bg-raised p-6 shadow-sm sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-ink">
            <DrishtiMark size={22} />
          </span>
          <p className="font-semibold tracking-tight">Drishti</p>
        </div>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.03em]">
          {isResetting ? "Reset your password" : mode === "signIn" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-fg-secondary">
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
              <form className="mt-8 flex flex-col gap-1" onSubmit={sendCode}>
                <Field label="Email" required>
                  <Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
                </Field>
                {errorAlert}
                <SubmitButton type="submit" status={pending} className="mt-3 w-full" labels={{ idle: "Send code", pending: "Sending…" }} />
              </form>
            ) : (
              <form className="mt-8 flex flex-col gap-1" onSubmit={verifyReset}>
                <Field label="Email" required>
                  <Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} readOnly placeholder="you@company.com" />
                </Field>
                <Field label="Code" required>
                  <Input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    placeholder="8-digit code"
                  />
                </Field>
                <Field label="New password" required>
                  <Input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 8 characters" />
                </Field>
                {errorAlert}
                <SubmitButton type="submit" status={pending} className="mt-3 w-full" labels={{ idle: "Reset password", pending: "Resetting…" }} />
              </form>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {resetStep === "code" ? (
                <button type="button" className={linkClass} disabled={isSubmitting || !canResend(secondsSinceSend)} onClick={() => void sendCode()}>
                  {canResend(secondsSinceSend) ? "Resend code" : `Resend code in ${RESEND_COOLDOWN_SECONDS - secondsSinceSend}s`}
                </button>
              ) : null}
              <button type="button" className={linkClass} disabled={isSubmitting} onClick={leaveReset}>
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <>
            <form className="mt-8 flex flex-col gap-1" onSubmit={submit}>
              {mode === "signUp" ? (
                <Field label="Name" required>
                  <Input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
                </Field>
              ) : null}
              <Field label="Email" required>
                <Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
              </Field>
              <Field
                label="Password"
                required
                labelAction={
                  mode === "signIn" ? (
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
                  ) : null
                }
              >
                <Input
                  required
                  minLength={8}
                  type="password"
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </Field>
              {errorAlert}
              <SubmitButton
                type="submit"
                status={pending}
                className="mt-3 w-full"
                labels={{ idle: mode === "signIn" ? "Sign in" : "Create account", pending: mode === "signIn" ? "Signing in…" : "Creating…" }}
              />
            </form>
            {SIGNUP_ENABLED ? (
              <button
                type="button"
                className={`mt-6 ${linkClass}`}
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
        <p className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-xs text-fg-tertiary">
          <ShieldCheck className="size-3.5" /> Your workspace is private by default.
        </p>
      </div>
    </main>
  );
}
