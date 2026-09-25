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
import { PriorityIcon } from "@/components/ui/priority-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Priority = "urgent" | "high" | "medium" | "low" | "none";

const PRIORITIES: { value: Priority; label: string; key: string }[] = [
  { value: "urgent", label: "Urgent", key: "1" },
  { value: "high", label: "High", key: "2" },
  { value: "medium", label: "Medium", key: "3" },
  { value: "low", label: "Low", key: "4" },
  { value: "none", label: "No priority", key: "0" },
];

export function priorityIcon(): ReactNode {
  return (
    <Wrapper>
      <PriorityIcon priority="high" />
    </Wrapper>
  );
}

export function priorityIconLevels(): ReactNode {
  return (
    <Wrapper>
      {PRIORITIES.map((p) => (
        <PriorityIcon key={p.value} priority={p.value} />
      ))}
    </Wrapper>
  );
}

export function priorityIconSizes(): ReactNode {
  return (
    <Wrapper>
      <PriorityIcon priority="urgent" size="xs" />
      <PriorityIcon priority="urgent" size="sm" />
      <PriorityIcon priority="urgent" size="md" />
      <PriorityIcon priority="urgent" size="lg" />
    </Wrapper>
  );
}

export function priorityIconLevelSizeMatrix(): ReactNode {
  const sizes = ["xs", "sm", "md", "lg"] as const;
  return (
    <Wrapper>
      <div className="grid grid-cols-4 gap-6">
        {PRIORITIES.map((p) =>
          sizes.map((size) => (
            <PriorityIcon
              key={`${p.value}-${size}`}
              priority={p.value}
              size={size}
            />
          )),
        )}
      </div>
    </Wrapper>
  );
}

/** Recipe: PriorityIcon as the leading icon of Combobox options. */
export function priorityIconCombobox(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox
          items={PRIORITIES}
          itemToStringLabel={(p: (typeof PRIORITIES)[number]) => p.label}
        >
          <ComboboxInput placeholder="Set priority" aria-label="Priority" />
          <ComboboxContent>
            <ComboboxEmpty>No priority found.</ComboboxEmpty>
            <ComboboxList>
              {(p: (typeof PRIORITIES)[number]) => (
                <ComboboxItem key={p.value} value={p}>
                  <PriorityIcon priority={p.value} size="sm" label="" />
                  {p.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

/** Recipe: Priority menu — DropdownMenu + PriorityIcon + DropdownMenuShortcut, keys 1/2/3/4/0. */
export function priorityIconMenu(): ReactNode {
  return <PriorityMenuDemo />;
}

function PriorityMenuDemo() {
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [open, setOpen] = React.useState(false);
  const current = PRIORITIES.find((p) => p.value === priority)!;
  return (
    <Wrapper>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Priority: ${current.label}`}
            />
          }
        >
          <PriorityIcon priority={priority} size="sm" label="" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-44"
          onKeyDown={(e) => {
            const hit = PRIORITIES.find((p) => p.key === e.key);
            if (!hit) return;
            e.preventDefault();
            setPriority(hit.value);
            setOpen(false);
          }}
        >
          {PRIORITIES.map((p) => (
            <DropdownMenuItem
              key={p.value}
              onClick={() => setPriority(p.value)}
            >
              <PriorityIcon priority={p.value} size="sm" label="" />
              {p.label}
              <DropdownMenuShortcut>{p.key}</DropdownMenuShortcut>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Wrapper>
  );
}

/** Recipe: PriorityIcon as the leading icon of Select options. */
export function priorityIconSelect(): ReactNode {
  return (
    <Wrapper>
      <Select items={PRIORITIES} defaultValue="high">
        <SelectTrigger className="w-44" aria-label="Priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              <PriorityIcon priority={p.value} size="sm" label="" />
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Wrapper>
  );
}
