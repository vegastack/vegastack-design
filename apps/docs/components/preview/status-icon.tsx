"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Copied INTO apps/docs via `shadcn add @vegastack/status-icon` (dogfoods the registry) → auto-scanned.
import { StatusIcon } from "@/components/ui/status-icon";

export function statusIcon(): ReactNode {
  return (
    <Wrapper>
      <StatusIcon status="progress" />
    </Wrapper>
  );
}

export function statusIconStates(): ReactNode {
  return (
    <Wrapper>
      <StatusIcon status="todo" />
      <StatusIcon status="progress" />
      <StatusIcon status="blocked" />
      <StatusIcon status="done" />
      <StatusIcon status="cancelled" />
    </Wrapper>
  );
}

export function statusIconAnimated(): ReactNode {
  return (
    <Wrapper>
      <StatusIcon status="progress" />
      <StatusIcon status="progress" animated />
    </Wrapper>
  );
}

export function statusIconSizes(): ReactNode {
  return (
    <Wrapper>
      <StatusIcon status="done" size="xs" />
      <StatusIcon status="done" size="sm" />
      <StatusIcon status="done" size="md" />
      <StatusIcon status="done" size="lg" />
    </Wrapper>
  );
}

export function statusIconWithLabel(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <StatusIcon status="todo" label="" />
        To do
      </span>
      <span className="flex items-center gap-2 text-sm text-info-text">
        <StatusIcon status="progress" label="" />
        In progress
      </span>
      <span className="flex items-center gap-2 text-sm text-warning-text">
        <StatusIcon status="blocked" label="" />
        Blocked
      </span>
      <span className="flex items-center gap-2 text-sm text-success-text">
        <StatusIcon status="done" label="" />
        Done
      </span>
    </Wrapper>
  );
}

export function statusIconStatusSizeMatrix(): ReactNode {
  const statuses = [
    "todo",
    "progress",
    "blocked",
    "done",
    "cancelled",
  ] as const;
  const sizes = ["xs", "sm", "md", "lg"] as const;
  return (
    <Wrapper>
      <div className="grid grid-cols-4 gap-6">
        {statuses.map((status) =>
          sizes.map((size) => (
            <StatusIcon key={`${status}-${size}`} status={status} size={size} />
          )),
        )}
      </div>
    </Wrapper>
  );
}

type Status = "todo" | "progress" | "blocked" | "done" | "cancelled";

const STATUSES: { value: Status; label: string; key: string }[] = [
  { value: "todo", label: "To do", key: "O" },
  { value: "progress", label: "In progress", key: "P" },
  { value: "blocked", label: "Blocked", key: "B" },
  { value: "done", label: "Done", key: "D" },
  { value: "cancelled", label: "Cancelled", key: "C" },
];

/**
 * Recipe: Status menu — DropdownMenu + StatusIcon + DropdownMenuShortcut. Keys O/P/B/D/C pick a
 * status while the menu is open; ⌥/Alt-click on the circle marks it Done without opening the menu.
 */
export function statusIconMenu(): ReactNode {
  return <StatusMenuDemo />;
}

function StatusMenuDemo() {
  const [status, setStatus] = React.useState<Status>("todo");
  const [open, setOpen] = React.useState(false);
  const current = STATUSES.find((s) => s.value === status)!;
  return (
    <Wrapper>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Status: ${current.label}. Alt-click to mark done`}
              onClick={(e) => {
                if (!e.altKey) return;
                e.preventBaseUIHandler();
                setStatus("done");
              }}
            />
          }
        >
          <StatusIcon status={status} size="sm" label="" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-44"
          onKeyDown={(e) => {
            const hit = STATUSES.find((s) => s.key === e.key.toUpperCase());
            if (!hit) return;
            e.preventDefault();
            setStatus(hit.value);
            setOpen(false);
          }}
        >
          {STATUSES.map((s) => (
            <DropdownMenuItem key={s.value} onClick={() => setStatus(s.value)}>
              <StatusIcon status={s.value} size="sm" label="" />
              {s.label}
              <DropdownMenuShortcut>{s.key}</DropdownMenuShortcut>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Wrapper>
  );
}

/** Recipe: StatusIcon as the leading icon of Select options. */
export function statusIconSelect(): ReactNode {
  return (
    <Wrapper>
      <Select items={STATUSES} defaultValue="progress">
        <SelectTrigger className="w-44" aria-label="Status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <StatusIcon status={s.value} size="sm" label="" />
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

/** Recipe: StatusIcon as the leading icon of Combobox options. */
export function statusIconCombobox(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox
          items={STATUSES}
          itemToStringLabel={(s: (typeof STATUSES)[number]) => s.label}
        >
          <ComboboxInput placeholder="Set status" aria-label="Status" />
          <ComboboxContent>
            <ComboboxEmpty>No status found.</ComboboxEmpty>
            <ComboboxList>
              {(s: (typeof STATUSES)[number]) => (
                <ComboboxItem key={s.value} value={s}>
                  <StatusIcon status={s.value} size="sm" label="" />
                  {s.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}
