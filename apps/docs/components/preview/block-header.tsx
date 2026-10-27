"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { ChevronDown, ListFilter, ListTodo, Table2 } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/block-header` (dogfoods the registry) → auto-scanned.
import {
  BlockHeader,
  BlockHeaderButton,
  BlockHeaderOpen,
} from "@/components/ui/block-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TABLES = [
  { value: "qa", label: "QA fixtures" },
  { value: "samples", label: "Sample requests" },
  { value: "leads", label: "Leads" },
];

/** A table block's header: icon · title · View ▾ · Filter · ⋯ · ↗ Open. */
export function blockHeader(): ReactNode {
  const [view, setView] = React.useState("Grid");
  return (
    <Wrapper className="block">
      <div className="rounded-lg border border-border">
        <BlockHeader
          icon={<Table2 />}
          title="QA fixtures"
          menu={
            <>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem>Remove block</DropdownMenuItem>
            </>
          }
          open={<BlockHeaderOpen href="#qa-fixtures" />}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={<BlockHeaderButton />}>
              {view} <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={view} onValueChange={setView}>
                <DropdownMenuRadioItem value="Grid">Grid</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Board">
                  Board
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <BlockHeaderButton>
            <ListFilter /> Filter (1)
          </BlockHeaderButton>
        </BlockHeader>
      </div>
    </Wrapper>
  );
}

/** Before a source is picked: the picker sits where the title will be. */
export function blockHeaderEmpty(): ReactNode {
  const [table, setTable] = React.useState<string | null>(null);
  const picked = TABLES.find((t) => t.value === table);
  return (
    <Wrapper className="block">
      <div className="rounded-lg border border-border">
        <BlockHeader
          icon={<Table2 />}
          title={picked?.label}
          picker={
            picked ? undefined : (
              <Select
                items={TABLES}
                value={table}
                onValueChange={(value) => setTable(value as string)}
              >
                <SelectTrigger size="sm" aria-label="Table" className="w-56">
                  <SelectValue placeholder="Pick a table…" />
                </SelectTrigger>
                <SelectContent>
                  {TABLES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          menu={
            <DropdownMenuItem onClick={() => setTable(null)}>
              {picked ? "Change table" : "Remove block"}
            </DropdownMenuItem>
          }
          open={picked ? <BlockHeaderOpen href="#table" /> : undefined}
        >
          <BlockHeaderButton>
            Grid <ChevronDown />
          </BlockHeaderButton>
        </BlockHeader>
      </div>
    </Wrapper>
  );
}

/** The same header over a task list block, and how it folds in a narrow column. */
export function blockHeaderTasks(): ReactNode {
  return (
    <Wrapper className="block space-y-3">
      <div className="rounded-lg border border-border">
        <BlockHeader
          icon={<ListTodo />}
          title="Tasks · My open"
          open={<BlockHeaderOpen href="#tasks" label="Open in Tasks" />}
        >
          <BlockHeaderButton>
            This space <ChevronDown />
          </BlockHeaderButton>
        </BlockHeader>
      </div>
      <div className="max-w-72 rounded-lg border border-border">
        <BlockHeader
          icon={<ListTodo />}
          title="Tasks · Assigned to me in this space"
          menu={<DropdownMenuItem>Remove block</DropdownMenuItem>}
          open={<BlockHeaderOpen href="#tasks" />}
        >
          <BlockHeaderButton>
            <ListFilter /> Filter
          </BlockHeaderButton>
        </BlockHeader>
      </div>
    </Wrapper>
  );
}
