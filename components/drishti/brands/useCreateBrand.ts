"use client";


import { useCallback, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { BrandCreatePath, BrandFormValues } from "./BrandForm";

const CREATE_ERROR_FALLBACK = "The rival could not be stored.";

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
  const createBrand = useMutation(api.brands.createBrand);
  const createBrandViaAgent = useAction(api.agent.createBrand);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const submit = useCallback(
    async (values: BrandFormValues, path: BrandCreatePath): Promise<boolean> => {
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
        if (path === "shared") {
          const result = await createBrandViaAgent(args);
          setSuccess(
            `Stored "${values.name}" through the shared path as ${result.status}.`,
          );
        } else {
          await createBrand(args);
          setSuccess(
            `Stored "${values.name}" through the manual path as pending.`,
          );
        }
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
    [createBrand, createBrandViaAgent],
  );

  return { submit, isSaving, error, success, reset };
}
