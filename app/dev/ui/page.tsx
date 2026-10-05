"use client";


import type { ReactNode } from "react";
import {
  Chip,
  EmptyState,
  Notice,
  PageHeader,
  Panel,
  PillButton,
  SectionHeader,
  StatTile,
} from "@/components/drishti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Block({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.04em] text-fg-tertiary">{name}</p>
      {children}
    </section>
  );
}

export default function UiHarness() {
  return (
    <div className="app-canvas min-h-dvh">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Block name="PageHeader / page">
          <PageHeader
            eyebrow="Brands"
            title="Tracked brands"
            sub="Every competitor Drishti is watching, with the freshest evidence first."
            actions={
              <>
                <PillButton variant="outline">Export</PillButton>
                <PillButton>Add brand</PillButton>
              </>
            }
          />
        </Block>

        <Block name="PageHeader / entity">
          <PageHeader
            variant="entity"
            eyebrow="Brands / SUGAR Cosmetics"
            title="SUGAR Cosmetics"
            meta="sugarcosmetics.com · 142 ads · checked 2 days ago"
            actions={<PillButton variant="outline" size="sm">Re-check</PillButton>}
          />
        </Block>

        <Block name="SectionHeader">
          <SectionHeader
            title="Newest evidence"
            sub="Last seven days across all engines."
            trailing={<a className="text-sm text-fg-secondary underline underline-offset-4" href="#">View all</a>}
          />
        </Block>

        <Block name="Panel: default / tint / interactive / header+body">
          <div className="grid gap-4 md:grid-cols-3">
            <Panel padded>Static panel. Hover does nothing.</Panel>
            <Panel tint padded>Tint panel, a pale plate.</Panel>
            <Panel interactive padded>Interactive panel, border tightens.</Panel>
          </div>
          <Panel className="mt-4">
            <Panel.Header title="What changed" description="Compared with last week." />
            <Panel.Body>Body content sits here.</Panel.Body>
          </Panel>
        </Block>

        <Block name="StatTile: neutral / ok / warn / danger / absent / loading">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile label="Active ads" value={1284} hint="Across 5 brands" />
            <StatTile label="Healthy runs" value={42} tone="ok" hint="All engines answered" />
            <StatTile label="Stale brands" value={3} tone="warn" hint="Not checked in 14 days" />
            <StatTile label="Failed runs" value={2} tone="danger" hint="See the runs page" />
            <StatTile label="Longest ad" value={null} hint="Not reported by the provider" />
            <StatTile label="Loading" value={0} loading />
          </div>
        </Block>

        <Block name="EmptyState: unbounded / bounded with action">
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState title="No runs for this cohort yet" description="Runs appear here once a check finishes." />
            <EmptyState
              bounded
              title="No brands tracked"
              description="Add a competitor to start collecting ads."
              action={<PillButton>Add brand</PillButton>}
            />
          </div>
        </Block>

        <Block name="Chip: neutral / status / you">
          <div className="flex flex-wrap items-center gap-2">
            <Chip label="Google Ads" tone="ok" />
            <Chip label="YouTube" value="social_proof" />
            <Chip variant="status" tone="ok" label="Fresh" />
            <Chip variant="status" tone="warn" label="Stale" />
            <Chip variant="status" tone="danger" label="Failed" />
            <Chip variant="you" label="You" />
          </div>
        </Block>

        <Block name="Notice: info / warn expanded / dismissible">
          <div className="space-y-3">
            <Notice title="Spend is estimated, not billed." dismissible>
              <p>Ad Library does not report spend.</p>
            </Notice>
            <Notice tone="warn" title="Two engines did not answer in the last run." defaultOpen>
              <p>YouTube timed out after 30 seconds.</p>
              <p>Google News returned an empty page.</p>
            </Notice>
            <Notice tone="info" title="Plain one-line notice." />
          </div>
        </Block>

        <Block name="Tabs: ink">
          <Tabs defaultValue="ads">
            <TabsList variant="ink">
              <TabsTrigger value="ads">Ads</TabsTrigger>
              <TabsTrigger value="hooks">Hooks</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>
            <TabsContent value="ads" className="pt-4 text-fg-secondary">Ads tab content.</TabsContent>
            <TabsContent value="hooks" className="pt-4 text-fg-secondary">Hooks tab content.</TabsContent>
            <TabsContent value="search" className="pt-4 text-fg-secondary">Search tab content.</TabsContent>
          </Tabs>
        </Block>
      </main>
    </div>
  );
}
