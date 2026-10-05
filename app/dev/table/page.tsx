"use client";


import { useState } from "react";
import { Chip, DataTable, type DataTableColumn } from "@/components/drishti";

type Row = { id: string; name: string; domain: string; status: "Ready" | "Pending"; findings: number };

const ROWS: Row[] = [
  { id: "1", name: "Lenskart", domain: "lenskart.com", status: "Ready", findings: 1284 },
  { id: "2", name: "Titan Eye+", domain: "titaneyeplus.com", status: "Ready", findings: 412 },
  { id: "3", name: "John Jacobs", domain: "johnjacobs.com", status: "Pending", findings: 7 },
];

const COLUMNS: DataTableColumn<Row>[] = [
  {
    id: "name",
    header: "Brand",
    kind: "primary",
    cell: (r) => (
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-fg">{r.name}</p>
        <p className="truncate text-xs text-fg-secondary">{r.domain}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    className: "w-36",
    cell: (r) => (
      <Chip variant="status" tone={r.status === "Ready" ? "ok" : "warn"}>
        {r.status}
      </Chip>
    ),
  },
  { id: "findings", header: "Findings", kind: "numeric", className: "w-28", cell: (r) => r.findings.toLocaleString("en-US") },
];

const EMPTY = { title: "No brands tracked yet.", description: "Add a rival to see its findings listed here." };

function Block({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.04em] text-fg-tertiary">{name}</p>
      {children}
    </section>
  );
}

export default function TableHarness() {
  const [clicked, setClicked] = useState("none");
  return (
    <div className="app-canvas min-h-dvh">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Block name={`DataTable / rows (clicked: ${clicked})`}>
          <DataTable label="Brands" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} onRowClick={(r) => setClicked(r.name)} />
        </Block>
        <Block name="DataTable / loading">
          <DataTable label="Brands" columns={COLUMNS} rows={[]} rowKey={(r) => r.id} loading />
        </Block>
        <Block name="DataTable / empty">
          <DataTable label="Brands" columns={COLUMNS} rows={[]} rowKey={(r) => r.id} empty={EMPTY} />
        </Block>
      </main>
    </div>
  );
}
