"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/editable-cell` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
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
        <span className="text-xs font-medium text-muted-foreground">
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
        <p className="text-xs text-muted-foreground">
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
        <span className="text-xs font-medium text-muted-foreground">
          Deal amount (server always rejects)
        </span>
        <EditableCell
          value={amount}
          label="Deal amount"
          onCommit={() => fakeSave(true)}
        />
        <p className="text-xs text-muted-foreground">
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
        <span className="text-xs font-medium text-muted-foreground">Stage</span>
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
          <span className="text-xs font-medium text-muted-foreground">
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
          <span className="text-xs font-medium text-muted-foreground">
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
          <span className="text-xs font-medium text-muted-foreground">
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

export function editableCellHeading(): ReactNode {
  const [title, setTitle] = useState("Weekly product sync");
  return (
    <Wrapper className="block">
      <h2 className="text-3xl font-semibold">
        <EditableCell
          value={title}
          label="Meeting title"
          onCommit={async (next) => {
            await fakeSave();
            setTitle(next);
          }}
        />
      </h2>
    </Wrapper>
  );
}

const PEOPLE: Record<string, string> = {
  u_7: "Asha Rao",
  u_9: "Kiran Mehta",
};

/**
 * DS-18: a custom editor whose value is an id. `renderValue` shows the person's name while
 * displaying; the editor still works on the id.
 */
export function editableCellCustomLabel(): ReactNode {
  const [owner, setOwner] = useState("u_7");
  return (
    <Wrapper>
      <EditableCell
        value={owner}
        label="Owner"
        onCommit={setOwner}
        renderValue={(id) => PEOPLE[id] ?? id}
        editor={{
          type: "custom",
          render: ({ value, commit, cancel }) => (
            <span className="flex gap-1">
              {Object.entries(PEOPLE).map(([id, name]) => (
                <Button
                  key={id}
                  size="sm"
                  variant={id === value ? "secondary" : "outline"}
                  aria-pressed={id === value}
                  onClick={() => commit(id)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") cancel();
                  }}
                >
                  {name}
                </Button>
              ))}
            </span>
          ),
        }}
      />
    </Wrapper>
  );
}
