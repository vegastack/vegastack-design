"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/sortable-list` (dogfoods the registry) → auto-scanned.
import {
  SortableList,
  type SortableListItem,
} from "@/components/ui/sortable-list";
import { Badge } from "@/components/ui/badge";

const STAGES: SortableListItem[] = [
  { id: "lead", label: "Lead" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "won", label: "Won", disabled: true },
];

function applyMove<T extends { id: string }>(
  prev: T[],
  id: string,
  index: number,
): T[] {
  const moved = prev.find((i) => i.id === id);
  if (!moved) return prev;
  const next = prev.filter((i) => i.id !== id);
  next.splice(index, 0, moved);
  return next;
}

export function sortableList(): ReactNode {
  const [items, setItems] = useState(STAGES);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <SortableList
          aria-label="Pipeline stages"
          items={items}
          renderItem={(item) => (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{item.label}</span>
              {item.disabled ? (
                <Badge variant="subtle" size="sm">
                  Locked
                </Badge>
              ) : null}
            </span>
          )}
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag the handle, press Space on it for keyboard move mode, or use the
          row menu — every path reaches every order.
        </p>
      </div>
    </Wrapper>
  );
}

export function sortableListGated(): ReactNode {
  const [items, setItems] = useState<SortableListItem[]>([
    { id: "domains", label: "Verified domains" },
    { id: "sso", label: "SSO providers" },
    { id: "webhooks", label: "Webhooks" },
  ]);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <SortableList
          aria-label="Settings sections (server rejects moving Webhooks)"
          items={items}
          renderItem={(item) => <span>{item.label}</span>}
          onReorder={({ id, to }) => {
            if (id === "webhooks")
              return new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error("locked")), 700),
              );
            setItems((prev) => applyMove(prev, id, to.index));
          }}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Moving “Webhooks” is refused by the host: the row shimmers while
          pending, then snaps back and announces the rejection.
        </p>
      </div>
    </Wrapper>
  );
}
