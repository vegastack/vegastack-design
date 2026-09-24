"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/sortable-list` (dogfoods the registry) → auto-scanned.
import {
  SortableList,
  type SortableListItem,
} from "@/components/ui/sortable-list";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";

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
          lockedReason="Closed stages stay last"
          renderItem={(item) => (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{item.label}</span>
              {item.disabled ? <Badge variant="secondary">Locked</Badge> : null}
            </span>
          )}
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
        <p className="mt-2 text-xs text-muted-foreground">
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
        <p className="mt-2 text-xs text-muted-foreground">
          Moving “Webhooks” is refused by the host: the row shimmers while
          pending, then snaps back and announces the rejection.
        </p>
      </div>
    </Wrapper>
  );
}

/**
 * The menu path — the lossless equivalent of a drag. Every row carries an
 * "Actions for …" menu with Move up / Move down / Move to top / Move to bottom, so the
 * whole ordering is reachable without a pointer and without entering keyboard
 * move mode. It is also the only path on a locked row's neighbours once the
 * pointer path is unavailable (audit B8-12). The drop-edge hairline, the lift
 * dim and the pending shimmer all come from the shared `drag-item` recipe, the
 * same one `Board` uses.
 */
export function sortableListMenu(): ReactNode {
  const [items, setItems] = useState<SortableListItem[]>([
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "billing", label: "Billing" },
    { id: "audit", label: "Audit log" },
  ]);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <SortableList
          aria-label="Navigation sections"
          items={items}
          renderItem={(item) => (
            <span className="min-w-0 truncate">{item.label}</span>
          )}
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Open a row’s menu to move it without dragging — the same reorder
          callback runs, so the host cannot tell the paths apart.
        </p>
      </div>
    </Wrapper>
  );
}

/**
 * An editable row: the content is a text field, so the drag starts only from the
 * handle and typing (Space included) never lifts the row. `renderActions` adds a
 * delete button beside the row menu.
 */
export function sortableListInlineRename(): ReactNode {
  const [items, setItems] = useState<SortableListItem[]>([
    { id: "small", label: "Small" },
    { id: "medium", label: "Medium" },
    { id: "large", label: "Large" },
  ]);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <SortableList
          aria-label="Size values"
          items={items}
          renderItem={(item) => (
            <Input
              aria-label={`Name for ${item.label}`}
              value={item.label}
              onChange={(event) =>
                setItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, label: event.target.value } : i,
                  ),
                )
              }
            />
          )}
          renderActions={(item) => (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${item.label}`}
              onClick={() =>
                setItems((prev) => prev.filter((i) => i.id !== item.id))
              }
            >
              <Trash2 />
            </Button>
          )}
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
      </div>
    </Wrapper>
  );
}

/**
 * Locked rows: built-in values keep their place. The handle becomes a spacer of
 * the same size, the row menu stays with its Move items disabled, and
 * `lockedReason` is read out as their description. Other rows move past them.
 */
export function sortableListLocked(): ReactNode {
  const [items, setItems] = useState<SortableListItem[]>([
    { id: "unit", label: "Unit", disabled: true },
    { id: "colour", label: "Colour" },
    { id: "material", label: "Material" },
    { id: "weight", label: "Weight", disabled: true },
  ]);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <SortableList
          aria-label="Product attributes"
          items={items}
          lockedReason="Built-in attributes can't move"
          renderItem={(item) => (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{item.label}</span>
              {item.disabled ? (
                <Badge variant="secondary">Built-in</Badge>
              ) : null}
            </span>
          )}
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
      </div>
    </Wrapper>
  );
}

const PHOTOS: SortableListItem[] = [
  { id: "landscape", label: "Landscape" },
  { id: "portrait-1", label: "Portrait 1" },
  { id: "portrait-2", label: "Portrait 2" },
  { id: "portrait-3", label: "Portrait 3" },
  { id: "landscape-2", label: "Landscape 2" },
];

const PHOTO_SRC: Record<string, string> = {
  landscape: "/preview/landscape.svg",
  "portrait-1": "/preview/avatar-1.svg",
  "portrait-2": "/preview/avatar-2.svg",
  "portrait-3": "/preview/avatar-3.svg",
  "landscape-2": "/preview/landscape.svg",
};

/**
 * The image grid: `layout="grid"` wraps the list into auto-fill tiles. Drops read
 * left or right of a tile, and in keyboard move mode ←/→ step one tile while
 * ↑/↓ step a whole row, however many columns the width allows.
 */
export function sortableListGrid(): ReactNode {
  const [items, setItems] = useState(PHOTOS);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xl">
        <SortableList
          aria-label="Product photos"
          layout="grid"
          items={items}
          renderItem={(item) => (
            <span className="flex min-w-0 flex-col gap-1">
              <Image
                src={PHOTO_SRC[item.id]}
                alt=""
                aspectRatio="square"
                rounded="md"
              />
              <span className="truncate text-xs text-muted-foreground">
                {item.label}
              </span>
            </span>
          )}
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
      </div>
    </Wrapper>
  );
}
