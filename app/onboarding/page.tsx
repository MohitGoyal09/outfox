"use client";


import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StepShell } from "@/components/drishti/onboarding/StepShell";
import { Step1YourBrand } from "@/components/drishti/onboarding/Step1YourBrand";
import { Step2Competitors, type SelectedCompetitor } from "@/components/drishti/onboarding/Step2Competitors";
import { Step3FirstCheck } from "@/components/drishti/onboarding/Step3FirstCheck";
import { resolveVertical, type BrandDraft, type OnboardingStep } from "@/components/drishti/onboarding/onboarding-model";

type OwnBrand = { id: string; name: string; domain: string; vertical: string };

export default function OnboardingPage() {
  const router = useRouter();
  const catalog = useQuery(api.brandCatalog.search, { query: "" });
  const createBrandProfile = useAction(api.pipeline.brandProfile.createBrandProfile);
  const setOwnBrand = useMutation(api.brands.setOwnBrand);
  const runComparison = useAction(api.pipeline.runComparison.runComparison);

  const [step, setStep] = useState<OnboardingStep>(1);
  const [ownDraft, setOwnDraft] = useState<BrandDraft>({ name: "", domain: "" });
  const [ownBrand, setOwnBrandState] = useState<OwnBrand | null>(null);
  const [step1Submitting, setStep1Submitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<SelectedCompetitor[]>([]);

  const [runId, setRunId] = useState<Id<"runs"> | null>(null);
  const [runStartError, setRunStartError] = useState<string | null>(null);
  const [runStarted, setRunStarted] = useState(false);

  const goHome = useMemo(() => () => router.push("/"), [router]);

  async function handleStep1Submit() {
    setStep1Submitting(true);
    setStep1Error(null);
    try {
      const vertical = resolveVertical(ownDraft.domain, catalog ?? []);
      const result = await createBrandProfile({
        name: ownDraft.name,
        domain: ownDraft.domain,
        vertical,
      });
      await setOwnBrand({ brandId: result.brandId });
      setOwnBrandState({
        id: String(result.brandId),
        name: ownDraft.name.trim(),
        domain: ownDraft.domain.trim(),
        vertical,
      });
      setStep(2);
    } catch (caught) {
      setStep1Error(caught instanceof Error && caught.message !== "" ? caught.message : "This brand could not be saved.");
    } finally {
      setStep1Submitting(false);
    }
  }

  async function handleStartCheck() {
    setStep(3);
    if (runStarted || ownBrand === null) return;
    setRunStarted(true);
    try {
      const brandIds = [ownBrand.id, ...competitors.map((row) => row.id)] as Id<"brands">[];
      const result = await runComparison({ brandIds, mode: "live", refreshAuthorized: true });
      setRunId(result.runId);
    } catch (caught) {
      setRunStartError(caught instanceof Error && caught.message !== "" ? caught.message : "The check could not start.");
    }
  }

  if (step === 1 || ownBrand === null) {
    return (
      <StepShell step={1} title="What brand do you work on?" description="Two things: a name and a website.">
        <Step1YourBrand
          draft={ownDraft}
          onChange={setOwnDraft}
          onSubmit={() => void handleStep1Submit()}
          submitting={step1Submitting}
          submitError={step1Error}
        />
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell
        step={2}
        title="Who do you compete with?"
        description={`Pick up to 5 ${ownBrand.vertical.toLowerCase()} brands. Outfox follows each one right away and checks it properly once you continue.`}
        onBack={() => setStep(1)}
      >
        <Step2Competitors
          ownBrandName={ownBrand.name}
          ownDomain={ownBrand.domain}
          vertical={ownBrand.vertical}
          selected={competitors}
          onAdd={(row) => setCompetitors((prev) => [...prev, row])}
          onRemove={(id) => setCompetitors((prev) => prev.filter((row) => row.id !== id))}
          onContinue={() => void handleStartCheck()}
          onBack={() => setStep(1)}
        />
      </StepShell>
    );
  }

  return (
    <StepShell
      step={3}
      title="Your first check"
      description="What Outfox found comparing you to the competitors you just picked."
      onBack={() => setStep(2)}
    >
      <Step3FirstCheck
        ownBrandId={ownBrand.id}
        ownBrandName={ownBrand.name}
        competitors={competitors}
        runId={runId}
        startError={runStartError}
        onDone={goHome}
        onBack={() => setStep(2)}
      />
    </StepShell>
  );
}
