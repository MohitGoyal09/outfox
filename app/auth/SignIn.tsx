"use client";

import { FormEvent, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

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
    <main className="flex min-h-dvh items-center justify-center bg-bg px-6 py-12 text-fg">
      <section className="w-full max-w-md rounded-2xl border border-border bg-bg-raised p-8 shadow-xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted">
          Drishti
        </p>
        <h1 className="mt-4 font-serif text-3xl text-fg">
          {mode === "signIn" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-fg-muted">
          Sign in to keep your brand research and evidence in one place.
        </p>

        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block text-sm">
            <span className="mb-2 block text-fg-muted">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-fg outline-none focus:border-fg-muted"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-fg-muted">Password</span>
            <input
              required
              minLength={8}
              type="password"
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-fg outline-none focus:border-fg-muted"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-opacity disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting
              ? "Working…"
              : mode === "signIn"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="mt-6 text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
          onClick={() => {
            setError(null);
            setMode(mode === "signIn" ? "signUp" : "signIn");
          }}
        >
          {mode === "signIn"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
