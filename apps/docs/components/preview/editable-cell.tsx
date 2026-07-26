"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/editable-cell` (dogfoods the registry) → auto-scanned.
import { EditableCell } from "@/components/ui/editable-cell";

function fakeSave(shouldFail = false): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(
      () => (shouldFail ? reject(new Error("conflict")) : resolve()),
      900,
    );
  });
}

export function editableCell(): ReactNode {
  const [name, setName] = useState("Acme Corporation");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Account name
        </span>
        <EditableCell
          value={name}
          label="Account name"
          onCommit={async (next) => {
            await fakeSave();
            setName(next);
          }}
        />
        <p className="text-sm text-muted-foreground">
          Click to edit. The commit is async — watch the saving indicator.
        </p>
      </div>
    </Wrapper>
  );
}

export function editableCellConflict(): ReactNode {
  const [amount] = useState("$12,400");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Deal amount (server always rejects)
        </span>
        <EditableCell
          value={amount}
          label="Deal amount"
          onCommit={() => fakeSave(true)}
        />
        <p className="text-sm text-muted-foreground">
          Every commit is rejected: the value snaps back and the revert is
          announced.
        </p>
      </div>
    </Wrapper>
  );
}

export function editableCellSelect(): ReactNode {
  const [stage, setStage] = useState("qualified");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Stage</span>
        <EditableCell
          value={stage}
          label="Stage"
          editor={{
            type: "select",
            options: [
              { value: "lead", label: "Lead" },
              { value: "qualified", label: "Qualified" },
              { value: "proposal", label: "Proposal" },
              { value: "won", label: "Won" },
            ],
          }}
          onCommit={async (next) => {
            await fakeSave();
            setStage(next);
          }}
        />
      </div>
    </Wrapper>
  );
}

export function editableCellStates(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Read-only
          </span>
          <EditableCell
            value="ACME-2041"
            label="Record id"
            readOnly
            onCommit={() => {}}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Disabled
          </span>
          <EditableCell
            value="Northwind Traders"
            label="Owner"
            disabled
            onCommit={() => {}}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Saving (controlled status)
          </span>
          <EditableCell
            value="Renewal 2027"
            label="Deal name"
            status="saving"
            onCommit={() => {}}
          />
        </div>
      </div>
    </Wrapper>
  );
}
