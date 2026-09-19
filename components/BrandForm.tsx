"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";

export function BrandForm({ className }: { className?: string }) {
  const createBrand = useMutation(api.brands.createBrand);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [vertical, setVertical] = useState("");
  const [aliases, setAliases] = useState("");
  const [advertiserId, setAdvertiserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (name.trim() === "" || domain.trim() === "" || vertical.trim() === "") {
      setError("Name, domain, and vertical are required.");
      return;
    }
    if (!domain.includes(".")) {
      setError("Domain must contain a dot, for example example.in.");
      return;
    }
    setSaving(true);
    try {
      const aliasList = aliases
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a !== "");
      const id = await createBrand({
        name: name.trim(),
        domain: domain.trim(),
        vertical: vertical.trim(),
        aliases: aliasList,
        ...(advertiserId.trim() !== ""
          ? { adsTransparencyAdvertiserId: advertiserId.trim() }
          : {}),
      });
      setCreated(String(id));
      setName("");
      setDomain("");
      setVertical("");
      setAliases("");
      setAdvertiserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label="Add a brand"
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-card-foreground">
        Add a brand
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manual create stores the profile as pending until it is hydrated.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-foreground">Name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Ayurveda"
            aria-label="Brand name"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-foreground">Domain</span>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="acme.in"
            aria-label="Brand domain"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-foreground">Vertical</span>
          <Input
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            placeholder="ayurveda"
            aria-label="Brand vertical"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-foreground">
            Aliases (comma separated)
          </span>
          <Input
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            placeholder="acme, acme ayur"
            aria-label="Brand aliases"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-foreground">
            Ads transparency advertiser id (optional)
          </span>
          <Input
            value={advertiserId}
            onChange={(e) => setAdvertiserId(e.target.value)}
            placeholder="AR_123"
            aria-label="Ads transparency advertiser id"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {created ? (
          <p className="text-sm text-foreground">
            Brand stored with id {created}.
          </p>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Spinner className="size-4" /> Saving
            </>
          ) : (
            "Create brand"
          )}
        </Button>
      </form>
    </section>
  );
}
