"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
import { BoardCard, BoardCardChip } from "@/components/ui/board-card";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { StatusIcon } from "@/components/ui/status-icon";
import { CalendarDays, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineEditTrigger } from "@/components/ui/editable-cell";
import { PriorityIcon } from "@/components/ui/priority-icon";
import {
  RowActionsMenu,
  type RowAction,
} from "@/components/ui/data-table-parts";

const DAY = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * DAY);

const actions: RowAction[] = [
  { label: "Open", onSelect: () => {} },
  { label: "Copy link", onSelect: () => {} },
  { type: "separator" },
  { label: "Cancel task", destructive: true, onSelect: () => {} },
];

export function boardCard(): ReactNode {
  const [done, setDone] = useState(false);
  return (
    <Wrapper className="block max-w-xs">
      <BoardCard
        title="Send the revised lighting schedule to the contractor"
        context="Harbour Tower · Acme Build"
        done={done}
        onDoneChange={setDone}
        due={at(2)}
        priority="high"
        assignee={{ name: "Priya Shah", hue: "purple" }}
        actions={
          <RowActionsMenu
            label="Send the revised lighting schedule"
            actions={actions}
          />
        }
      />
    </Wrapper>
  );
}

/** The due chip: destructive when overdue, warning when due today, quiet otherwise. */
export function boardCardDue(): ReactNode {
  return (
    <Wrapper className="grid max-w-xs gap-3">
      <BoardCard title="Overdue" context="Website · Northwind" due={at(-2)} />
      <BoardCard title="Due today" context="Website · Northwind" due={at(0)} />
      <BoardCard title="Due later" context="Website · Northwind" due={at(9)} />
    </Wrapper>
  );
}

/** The priority chip: Urgent and High are coloured, Medium and Low are quiet. */
export function boardCardPriority(): ReactNode {
  return (
    <Wrapper className="grid max-w-xs gap-3">
      <BoardCard title="Fix the checkout outage" priority="urgent" />
      <BoardCard title="Draft the Q4 plan" priority="high" />
      <BoardCard title="Tidy the style guide" priority="medium" />
      <BoardCard title="Rename the old folders" priority="low" />
    </Wrapper>
  );
}

/** Done: the tick is filled and the title struck through; the due chip goes quiet. */
export function boardCardDone(): ReactNode {
  const [done, setDone] = useState(true);
  return (
    <Wrapper className="block max-w-xs">
      <BoardCard
        title="Book the site visit"
        context="Harbour Tower · Acme Build"
        done={done}
        onDoneChange={setDone}
        due={at(-1)}
        assignee={{ name: "Alex Lee", hue: "green" }}
      />
    </Wrapper>
  );
}

/** Minimal: a title alone, and a standalone card that is a link. */
export function boardCardMinimal(): ReactNode {
  return (
    <Wrapper className="grid max-w-xs gap-3">
      <BoardCard title="Just a title" />
      <BoardCard
        title="A card that opens its record"
        context="Linked with href"
        href="#task"
      />
    </Wrapper>
  );
}

const CARD_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
type CardPriority = (typeof CARD_PRIORITIES)[number];

/** Editable footer fields: each whole field opens its editor; unset ones appear on hover. */
export function boardCardEditable(): ReactNode {
  const [priority, setPriority] = useState<CardPriority | null>("urgent");
  return (
    <Wrapper className="block max-w-xs">
      <BoardCard
        title="Confirm the site visit with the client"
        context="Harbour Tower · Acme Build"
        due={at(1)}
        priority={priority}
        renderField={(field, face, empty) =>
          field === "priority" ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <InlineEditTrigger
                    layout="chip"
                    aria-label={
                      empty ? "Set priority" : `Priority: ${priority}`
                    }
                  />
                }
              >
                {face}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {CARD_PRIORITIES.map((p) => (
                  <DropdownMenuItem key={p} onClick={() => setPriority(p)}>
                    <PriorityIcon priority={p} size="sm" label="" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setPriority(null)}>
                  <PriorityIcon priority="none" size="sm" label="" />
                  No priority
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <InlineEditTrigger
              layout="chip"
              aria-label={field === "due" ? "Change due date" : "Set assignee"}
            >
              {face}
            </InlineEditTrigger>
          )
        }
      />
    </Wrapper>
  );
}

/** The quieter Linear-style card: eyebrow, a status lead, an avatar aside, pill chips, an alert and a footnote. */
export function boardCardSlots(): ReactNode {
  return (
    <Wrapper className="block max-w-xs">
      <BoardCard
        eyebrow="↳ Harbour Tower handover"
        title="Send the revised lighting schedule to the contractor"
        status={<StatusIcon status="progress" size="sm" />}
        aside={<PersonAvatar person={{ name: "Priya Shah", hue: "purple" }} />}
        chips={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<BoardCardChip render={<button type="button" />} />}
              >
                <PriorityIcon priority="high" size="sm" label="" />
                High
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Urgent</DropdownMenuItem>
                <DropdownMenuItem>High</DropdownMenuItem>
                <DropdownMenuItem>Medium</DropdownMenuItem>
                <DropdownMenuItem>Low</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <BoardCardChip>
              <CalendarDays />
              Fri
            </BoardCardChip>
            <BoardCardChip>
              <Tag />
              Electrical
            </BoardCardChip>
          </>
        }
        alert="Blocked by 2"
        footnote="Created 9 Oct"
      />
    </Wrapper>
  );
}
