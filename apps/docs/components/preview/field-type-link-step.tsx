"use client";

import { useState, type ReactNode } from "react";
import {
  Building2,
  Calendar,
  FileText,
  FolderKanban,
  Hash,
  Link2,
  ListChecks,
  Rows3,
  Type,
  Video,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FieldTypePicker } from "@/components/ui/field-type-picker";
// Copied INTO apps/docs via `shadcn add @vegastack/field-type-link-step` (dogfoods the registry) → auto-scanned.
import {
  FieldTypeLinkStep,
  type FieldLinkChoice,
  type FieldLinkKind,
} from "@/components/ui/field-type-link-step";

const TYPES = [
  { id: "text", label: "Text", icon: <Type /> },
  { id: "number", label: "Number", icon: <Hash /> },
  { id: "date", label: "Date", icon: <Calendar /> },
  {
    id: "link",
    label: "Link to",
    icon: <Link2 />,
    group: "Relations",
    description: "Records elsewhere in the workspace",
    next: true,
  },
];

const KINDS: FieldLinkKind[] = [
  {
    id: "page",
    label: "Pages",
    icon: <FileText />,
    group: "Library",
    description: "Each cell links to pages in the Library",
  },
  {
    id: "meeting",
    label: "Meetings",
    icon: <Video />,
    group: "Library",
    description: "Each cell links to meetings and their notes",
  },
  {
    id: "task",
    label: "Tasks",
    icon: <ListChecks />,
    group: "Work",
    description: "Each cell links to tasks; their status shows in the cell",
  },
  {
    id: "project",
    label: "Projects",
    icon: <FolderKanban />,
    group: "Sales",
    description: "Each cell links to projects",
  },
  {
    id: "customer",
    label: "Customers",
    icon: <Building2 />,
    group: "Sales",
    description: "Each cell links to customers",
  },
  {
    id: "table_row",
    label: "Rows",
    icon: <Rows3 />,
    group: "Tables",
    table: true,
    description: "Rows of another table — choose which next",
  },
];

const TABLES = [
  { id: "qa", label: "QA fixtures", description: "117 rows" },
  { id: "samples", label: "Sample requests", description: "42 rows" },
  { id: "leads", label: "Leads", description: "8 rows" },
];

function describe(choice: { type: string } & Partial<FieldLinkChoice>) {
  if (choice.type !== "link")
    return TYPES.find((t) => t.id === choice.type)?.label;
  const kind = KINDS.find((k) => k.id === choice.kind)?.label;
  const table = TABLES.find((t) => t.id === choice.table)?.label;
  return table ? `Link to ${kind} of ${table}` : `Link to ${kind}`;
}

/** + Add field → Link to → a kind of record, or Rows → a table. */
export function fieldTypeLinkStep(): ReactNode {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<
    ({ type: string } & Partial<FieldLinkChoice>) | null
  >(null);
  return (
    <Wrapper>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" />}>
          {choice ? describe(choice) : "Add field"}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <FieldTypePicker
            types={TYPES}
            value={choice?.type}
            groupOrder={["Relations"]}
            onSelect={(type) => {
              setChoice({ type });
              setOpen(false);
            }}
            renderStep={(type, controls) => (
              <FieldTypeLinkStep
                controls={controls}
                kinds={KINDS}
                groupOrder={["Library", "Work", "Sales", "Tables"]}
                tables={TABLES}
                value={choice?.type === type.id ? choice : undefined}
                onSelect={(link) => {
                  setChoice({ type: type.id, ...link });
                  setOpen(false);
                }}
              />
            )}
          />
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

/** The step on its own, as it renders inside the picker (no popover). */
export function fieldTypeLinkStepInline(): ReactNode {
  const [last, setLast] = useState("Nothing chosen yet");
  return (
    <Wrapper className="block max-w-sm">
      <div className="overflow-hidden rounded-lg border border-border">
        <FieldTypePicker
          types={TYPES}
          onSelect={(id) => setLast(`Type: ${id}`)}
          renderStep={(type, controls) => (
            <FieldTypeLinkStep
              controls={controls}
              kinds={KINDS}
              groupOrder={["Library", "Work", "Sales", "Tables"]}
              tables={TABLES}
              onSelect={(link) =>
                setLast(describe({ type: type.id, ...link }) ?? "")
              }
            />
          )}
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {last}
      </p>
    </Wrapper>
  );
}
