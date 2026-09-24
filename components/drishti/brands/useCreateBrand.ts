"use client";


import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { BrandCreatePath, BrandFormValues } from "./BrandForm";

const CREATE_ERROR_FALLBACK = "The rival could not be saved.";

export type UseCreateBrand = {
  submit: (
    values: BrandFormValues,
    path: BrandCreatePath,
  ) => Promise<boolean>;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  reset: () => void;
};

export function useCreateBrand(): UseCreateBrand {
  const createBrandProfile = useAction(api.pipeline.brandProfile.createBrandProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const submit = useCallback(
    async (values: BrandFormValues, path: BrandCreatePath): Promise<boolean> => {
      void path;
      setError(null);
      setSuccess(null);
      setIsSaving(true);
      try {
        const args = {
          name: values.name,
          domain: values.domain,
          vertical: values.vertical,
          aliases: values.aliases,
          ...(values.adsTransparencyAdvertiserId !== undefined
            ? { adsTransparencyAdvertiserId: values.adsTransparencyAdvertiserId }
            : {}),
        };
        const result = await createBrandProfile(args);
        const outcome = result.needsConfirmation
          ? "needs confirmation"
          : result.status;
        setSuccess(`Saved "${values.name}" as ${outcome}.`);
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error && caught.message !== ""
            ? caught.message
            : CREATE_ERROR_FALLBACK,
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [createBrandProfile],
  );

  return { submit, isSaving, error, success, reset };
}
