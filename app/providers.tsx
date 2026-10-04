"use client";

import { ConvexAuthProvider, useConvexAuth } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const SignIn = dynamic(() => import("@/app/auth/SignIn").then((m) => m.SignIn), { ssr: false });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <TooltipProvider>
        <AuthGate>{children}</AuthGate>
        <Toaster />
      </TooltipProvider>
    </ConvexAuthProvider>
  );
}

const PUBLIC_PATH_PREFIXES = ["/share/board/"];
const SIGN_IN_PATH = "/signin";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const pathname = usePathname();
  const router = useRouter();
  const signedInAtSignIn = isAuthenticated && pathname === SIGN_IN_PATH;

  useEffect(() => {
    if (signedInAtSignIn) router.replace("/");
  }, [signedInAtSignIn, router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) delete document.documentElement.dataset.authed;
  }, [isLoading, isAuthenticated]);

  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return children;

  if (isLoading && pathname === "/") {
    return (
      <>
        <LoadingSplash className="auth-splash" />
        <LandingPage />
      </>
    );
  }
  if (isLoading) return <LoadingSplash />;

  if (signedInAtSignIn) return null;
  if (isAuthenticated) return children;
  return pathname === "/" ? <LandingPage /> : <SignIn />;
}

function LoadingSplash({ className }: { className?: string }) {
  return (
    <main className={`flex min-h-dvh items-center justify-center bg-bg px-6 text-fg ${className ?? ""}`}>
      <div className="flex items-center gap-3 text-sm text-fg-secondary"><span className="size-2 animate-pulse rounded-full bg-accent" /> Preparing your research desk…</div>
    </main>
  );
}
