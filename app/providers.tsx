"use client";

import { ConvexAuthProvider, useConvexAuth } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SignIn } from "@/app/auth/SignIn";
import { LandingPage } from "@/components/landing/LandingPage";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

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

  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return children;

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-6 text-fg">
        <div className="flex items-center gap-3 text-sm text-fg-secondary"><span className="size-2 animate-pulse rounded-full bg-accent" /> Preparing your research desk…</div>
      </main>
    );
  }

  if (signedInAtSignIn) return null;
  if (isAuthenticated) return children;
  return pathname === "/" ? <LandingPage /> : <SignIn />;
}
