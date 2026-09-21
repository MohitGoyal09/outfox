"use client";

import { ConvexAuthProvider, useConvexAuth } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { SignIn } from "@/app/auth/SignIn";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <AuthGate>{children}</AuthGate>
    </ConvexAuthProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-6 text-fg">
        <p className="text-sm text-fg-muted">Loading your workspace…</p>
      </main>
    );
  }

  return isAuthenticated ? children : <SignIn />;
}
