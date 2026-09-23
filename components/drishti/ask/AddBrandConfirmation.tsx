"use client";


import { useState } from "react";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import type { ApprovalPartView } from "./agentChat-model";

export type AddBrandProposal = { name: string; domain: string | null };

export function addBrandProposalOf(part: {
  toolName: string;
  input?: unknown;
}): AddBrandProposal | null {
  if (part.toolName !== "add_brand") return null;
  const input = (part.input ?? {}) as { name?: unknown; domain?: unknown };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name === "") return null;
  const domain = typeof input.domain === "string" ? input.domain.trim() : "";
  return { name, domain: domain === "" ? null : domain };
}

export function AddBrandConfirmation({
  part,
  onRespondToApproval,
  onSubmitCorrection,
}: {
  part: ApprovalPartView;
  onRespondToApproval: (approvalId: string, approved: boolean) => void;
  onSubmitCorrection: (question: string) => void;
}) {
  const proposal = addBrandProposalOf(part);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(proposal?.name ?? "");
  const [domain, setDomain] = useState(proposal?.domain ?? "");

  const approvalId = part.approval?.id;
  const nextName = name.trim();
  const nextDomain = domain.trim();
  const changed =
    proposal !== null &&
    (nextName !== proposal.name || (nextDomain === "" ? null : nextDomain) !== proposal.domain);
  const canUseEdits = nextName !== "" && changed;
  const hasDomain = proposal?.domain !== null && proposal?.domain !== undefined;

  return (
    <Confirmation approval={part.approval} state="approval-requested">
      <ConfirmationTitle>
        Add {proposal?.name}
        {hasDomain ? ` (${proposal?.domain})` : " (no website found)"} to your
        workspace?
      </ConfirmationTitle>

      <ConfirmationRequest>
        {editing ? (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Brand</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Brand name"
                className="rounded-md border border-border-strong bg-bg-raised px-2 py-1 text-fg"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Website</span>
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="e.g. dotandkey.com"
                className="rounded-md border border-border-strong bg-bg-raised px-2 py-1 text-fg"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Changing these sends the correction back to the agent. It proposes
              the brand again and you confirm once more.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {hasDomain
              ? "Accepting fetches this brand from the five engines and adds it to your workspace. Check the name and website are the brand you meant."
              : "No website was found for this name, so it cannot be told apart from anything else with the same name. Accepting still adds it."}
          </p>
        )}
      </ConfirmationRequest>

      <ConfirmationActions>
        <ConfirmationAction
          variant="outline"
          onClick={() => approvalId !== undefined && onRespondToApproval(approvalId, false)}
        >
          Deny
        </ConfirmationAction>
        {proposal !== null ? (
          <ConfirmationAction variant="outline" onClick={() => setEditing((open) => !open)}>
            {editing ? "Cancel edit" : "Edit"}
          </ConfirmationAction>
        ) : null}
        {canUseEdits ? (
          <ConfirmationAction
            onClick={() => {
              if (approvalId !== undefined) onRespondToApproval(approvalId, false);
              onSubmitCorrection(`Add ${nextName} to my catalog. Its website is ${nextDomain}.`);
            }}
          >
            Use these instead
          </ConfirmationAction>
        ) : (
          <ConfirmationAction
            onClick={() => approvalId !== undefined && onRespondToApproval(approvalId, true)}
          >
            Accept
          </ConfirmationAction>
        )}
      </ConfirmationActions>

      <ConfirmationAccepted>
        <p className="text-sm text-muted-foreground">Approved. The agent adds this brand once.</p>
      </ConfirmationAccepted>
      <ConfirmationRejected>
        <p className="text-sm text-muted-foreground">Denied. Nothing was added.</p>
      </ConfirmationRejected>
    </Confirmation>
  );
}
