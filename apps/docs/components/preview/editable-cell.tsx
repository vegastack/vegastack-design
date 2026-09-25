"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/editable-cell` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { EditableCell } from "@/components/ui/editable-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function fakeSave(shouldFail = false, ms = 200): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(
      () =>
        shouldFail
          ? reject(new Error("Someone else changed this value."))
          : resolve(),
      ms,
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
          onSave={async (next) => {
            await fakeSave();
            setName(next);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Click, or Tab then Enter or F2. Only the caret shows it is editing.
          Enter or blur saves; Escape cancels.
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
          Deal amount (the server always rejects)
        </span>
        <EditableCell
          value={amount}
          label="Deal amount"
          onSave={() => fakeSave(true, 600)}
        />
        <p className="text-xs text-muted-foreground">
          Every save fails: the value rolls back, the failure is announced and a
          toast offers Retry.
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
          onSave={async (next) => {
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
            onSave={() => {}}
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
            onSave={() => {}}
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
            onSave={() => {}}
          />
        </div>
      </div>
    </Wrapper>
  );
}

export function editableCellHeading(): ReactNode {
  const [title, setTitle] = useState(
    "Weekly product sync with the platform, design and customer success teams",
  );
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-md flex-col gap-1">
        <h2 className="text-2xl font-semibold">
          <EditableCell
            variant="heading"
            flush
            required
            value={title}
            label="Meeting title"
            tooltip="Click to rename"
            onSave={async (next) => {
              await fakeSave();
              setTitle(next);
            }}
          />
        </h2>
        <p className="text-sm text-muted-foreground">Tuesday, 10:00 · 45 min</p>
      </div>
    </Wrapper>
  );
}

const ROWS = [
  { id: "d1", name: "Acme renewal", owner: "Asha Rao", amount: "$12,400" },
  { id: "d2", name: "Globex pilot", owner: "Kiran Mehta", amount: "$4,800" },
  { id: "d3", name: "Initech expansion", owner: "Asha Rao", amount: "$31,000" },
];

/** Table cells: `variant="cell"` fills the cell; Enter or Tab saves and moves on (`onNavigate`). */
export function editableCellTable(): ReactNode {
  const [rows, setRows] = useState(ROWS);
  const [active, setActive] = useState<string | null>(null);
  const cells = rows.flatMap((row) => [`${row.id}:name`, `${row.id}:amount`]);
  const update = (id: string, key: "name" | "amount", next: string) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: next } : row)),
    );
  const cell = (row: (typeof ROWS)[number], key: "name" | "amount") => {
    const cellId = `${row.id}:${key}`;
    return (
      <EditableCell
        variant="cell"
        value={row[key]}
        label={key === "name" ? "Deal" : "Amount"}
        editing={active === cellId}
        onEditingChange={(open) =>
          setActive((current) =>
            open ? cellId : current === cellId ? null : current,
          )
        }
        onNavigate={(direction) => {
          const index = cells.indexOf(cellId);
          const next = cells[index + (direction === "next" ? 1 : -1)];
          setActive(next ?? null);
        }}
        required
        onSave={async (next) => {
          await fakeSave();
          update(row.id, key, next);
        }}
      />
    );
  };
  return (
    <Wrapper className="block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="w-32">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{cell(row, "name")}</TableCell>
              <TableCell>{row.owner}</TableCell>
              <TableCell>{cell(row, "amount")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

/** Multiline: Enter adds a line, ⌘/Ctrl+Enter or blur saves. */
export function editableCellMultiline(): ReactNode {
  const [notes, setNotes] = useState(
    "Wants a pilot in Q3.\nLegal review pending — follow up Friday.",
  );
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <EditableCell
          multiline
          value={notes}
          label="Notes"
          editor={{ type: "text", placeholder: "Add notes" }}
          onSave={async (next) => {
            await fakeSave();
            setNotes(next);
          }}
        />
      </div>
    </Wrapper>
  );
}

/** Required: clearing the value restores the previous one with a message. */
export function editableCellRequired(): ReactNode {
  const [name, setName] = useState("Northwind Traders");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Company (required)
        </span>
        <EditableCell
          required
          value={name}
          label="Company"
          onSave={async (next) => {
            await fakeSave();
            setName(next);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Clear it and press Enter: the old value comes back.
        </p>
      </div>
    </Wrapper>
  );
}

/** A slow save: the value updates at once; the spinner appears only after 300ms. */
export function editableCellSlow(): ReactNode {
  const [name, setName] = useState("Q3 planning");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Project (2s save)
        </span>
        <EditableCell
          value={name}
          label="Project"
          onSave={async (next) => {
            await fakeSave(false, 2000);
            setName(next);
          }}
        />
      </div>
    </Wrapper>
  );
}

/** Parity: the same value in view and in edit mode, one above the other — nothing moves. */
export function editableCellParity(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto grid w-full max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-xs text-muted-foreground">View</span>
        <span className="bg-[repeating-linear-gradient(to_bottom,transparent_0_19px,var(--color-border)_19px_20px)]">
          <EditableCell
            value="Quarterly business review"
            label="Title (view)"
          />
        </span>
        <span className="text-xs text-muted-foreground">Edit</span>
        <span className="bg-[repeating-linear-gradient(to_bottom,transparent_0_19px,var(--color-border)_19px_20px)]">
          <EditableCell
            value="Quarterly business review"
            label="Title (edit)"
            editing
            onEditingChange={() => {}}
          />
        </span>
        <span className="text-xs text-muted-foreground">Heading</span>
        <h3 className="text-xl font-semibold">
          <EditableCell
            variant="heading"
            value="Same size, weight and line box"
            label="Heading"
          />
        </h3>
      </div>
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
        onSave={setOwner}
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
