"use client";

import { FormEvent, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AlertCircle, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn("password", { flow: mode, email, password });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-bg px-4 py-6 text-fg sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-5xl overflow-hidden rounded-xl border border-border bg-bg-raised lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
          <div>
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-md bg-sidebar-primary text-lg font-semibold text-sidebar-primary-foreground">D</span><div><p className="font-semibold tracking-tight">Drishti</p><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/55">Evidence atlas</p></div></div>
            <div className="mt-24 max-w-sm"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-primary">Research desk</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.035em]">See the trail behind every claim.</h1><p className="mt-5 text-sm leading-6 text-sidebar-foreground/65">Compare brands with public signals that stay inspectable from first search to final brief.</p></div>
          </div>
          <div className="grid gap-3 text-xs text-sidebar-foreground/65"><p className="flex items-center gap-2"><Check className="size-4 text-sidebar-primary" /> Search, ads, creator and demand signals</p><p className="flex items-center gap-2"><Check className="size-4 text-sidebar-primary" /> Evidence stored with provenance</p><p className="flex items-center gap-2"><Check className="size-4 text-sidebar-primary" /> Answers grounded in your research</p></div>
        </section>
        <section className="flex items-center px-6 py-10 sm:px-12"><div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3 lg:hidden"><span className="flex size-9 items-center justify-center rounded-md bg-sidebar text-sm font-semibold text-sidebar-primary">D</span><p className="font-semibold tracking-tight">Drishti</p></div>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.16em] text-accent lg:mt-0">Private research desk</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">{mode === "signIn" ? "Welcome back" : "Create your account"}</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-fg-secondary">{mode === "signIn" ? "Continue your brand research with the evidence still attached." : "Start a private evidence desk for the brands you follow."}</p>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" required minLength={8} type="password" autoComplete={mode === "signIn" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></div>
            {error ? <Alert variant="destructive"><AlertCircle className="size-4" /><AlertDescription>{error}</AlertDescription></Alert> : null}
            <Button type="submit" disabled={isSubmitting} className="h-10 w-full justify-between rounded-md bg-accent px-4 text-accent-ink hover:bg-accent-strong"><span>{isSubmitting ? "Working…" : mode === "signIn" ? "Sign in" : "Create account"}</span><ArrowRight className="size-4" /></Button>
          </form>
          <button type="button" className="mt-6 text-sm text-fg-secondary underline decoration-border-strong underline-offset-4 hover:text-fg" onClick={() => { setError(null); setMode(mode === "signIn" ? "signUp" : "signIn"); }}>{mode === "signIn" ? "Need an account? Create one" : "Already have an account? Sign in"}</button>
          <p className="mt-10 flex items-center gap-2 text-xs text-fg-tertiary"><ShieldCheck className="size-3.5" /> Your workspace is private by default.</p>
        </div></section>
      </div>
    </main>
  );
}
