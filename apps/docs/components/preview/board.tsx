"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/board` (dogfoods the registry) → auto-scanned.
import { Board, type BoardColumn } from "@/components/ui/board";
import { Avatar } from "@/components/ui/avatar";

interface Deal {
  id: string;
  name: string;
  amount: string;
  owner: string;
}

const INITIAL: BoardColumn<Deal>[] = [
  {
    id: "qualified",
    title: "Qualified",
    items: [
      { id: "d1", name: "Acme renewal", amount: "$12,400", owner: "PS" },
      { id: "d2", name: "Globex expansion", amount: "$48,000", owner: "MK" },
    ],
  },
  {
    id: "proposal",
    title: "Proposal",
    items: [{ id: "d3", name: "Initech pilot", amount: "$9,800", owner: "AL" }],
  },
  { id: "won", title: "Won", items: [], collapsed: false },
  {
    id: "lost",
    title: "Lost",
    items: [
      { id: "d4", name: "Umbrella lapse", amount: "$3,100", owner: "PS" },
    ],
    droppable: false,
    lockedReason: "Lost deals move by automation",
    collapsed: true,
  },
];

function applyMove(
  prev: BoardColumn<Deal>[],
  id: string,
  container: string,
  index: number,
): BoardColumn<Deal>[] {
  const moved = prev.flatMap((c) => c.items).find((d) => d.id === id);
  if (!moved) return prev;
  return prev.map((column) => {
    const without = column.items.filter((d) => d.id !== id);
    if (column.id !== container) return { ...column, items: without };
    const next = [...without];
    next.splice(index, 0, moved);
    return { ...column, items: next };
  });
}

export function board(): ReactNode {
  const [columns, setColumns] = useState(INITIAL);
  return (
    <Wrapper className="block">
      <Board<Deal>
        aria-label="Deals"
        columns={columns}
        getItemId={(deal) => deal.id}
        renderCard={(deal) => (
          <>
            <span className="min-w-0 truncate font-medium">{deal.name}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar size="xs" fallback={deal.owner} />
              {deal.amount}
            </span>
          </>
        )}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

export function boardGated(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>([
    {
      id: "open",
      title: "Open",
      items: [
        { id: "g1", name: "Northwind upsell", amount: "$22,000", owner: "MK" },
      ],
    },
    { id: "review", title: "In review", items: [] },
  ]);
  return (
    <Wrapper className="block">
      <Board<Deal>
        aria-label="Gated pipeline (the server rejects every move)"
        columns={columns}
        getItemId={(deal) => deal.id}
        renderCard={(deal) => (
          <span className="min-w-0 truncate">{deal.name}</span>
        )}
        onMove={() =>
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("stage gate")), 800),
          )
        }
      />
    </Wrapper>
  );
}
