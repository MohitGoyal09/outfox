import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-2xl space-y-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Drishti
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Commerce intelligence with evidence.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          The Convex, SerpApi, TypeSafe, and AI Elements foundation is ready.
        </p>
        <Button>Start a brand cohort</Button>
      </section>
    </main>
  );
}
