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
import { Checkbox } from "@/components/ui/checkbox";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentProgress,
} from "@/components/ui/attachment";

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
          lockedReason="Closed stages can't be moved"
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
          Drag the handle, long-press a row on a touch screen, or press Space on
          the handle for keyboard move mode — every path reaches every order.
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
 * Remove: `onRemove` puts a small × in each row's trailing corner, shown on hover or focus
 * within the row and always on a touch screen. Focus moves to the row that takes the removed
 * row's place. The drop-edge hairline, the lift dim and the pending shimmer come from the
 * shared `drag-item` recipe, the same one `Board` uses.
 */
export function sortableListRemove(): ReactNode {
  const [items, setItems] = useState<SortableListItem[]>([
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "billing", label: "Billing" },
    { id: "audit", label: "Audit log" },
  ]);
  const [required, setRequired] = useState<ReadonlySet<string>>(
    () => new Set(["overview"]),
  );
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <SortableList
          aria-label="Navigation sections"
          items={items}
          renderItem={(item) => (
            <span className="min-w-0 truncate">{item.label}</span>
          )}
          renderActions={(item) => (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={required.has(item.id)}
                aria-label={`Required ${item.label ?? item.id}`}
                onCheckedChange={(on) =>
                  setRequired((prev) => {
                    const next = new Set(prev);
                    if (on === true) next.add(item.id);
                    else next.delete(item.id);
                    return next;
                  })
                }
              />
              <span aria-hidden>Required</span>
            </label>
          )}
          onRemove={(item) =>
            setItems((prev) => prev.filter((i) => i.id !== item.id))
          }
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
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
          onRemove={(item) =>
            setItems((prev) => prev.filter((i) => i.id !== item.id))
          }
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

export function sortableListRowActions(): ReactNode {
  const [items, setItems] = useState(STAGES);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <SortableList
          aria-label="Pipeline stages with actions"
          items={items}
          lockedReason="Closed stages can't be moved"
          getItemActions={(item) => [
            { label: "Rename", onSelect: () => {} },
            {
              label: "Delete",
              destructive: true,
              disabled: item.disabled,
              disabledReason: "Built-in stages can't be deleted",
              onSelect: () =>
                setItems((prev) => prev.filter((i) => i.id !== item.id)),
            },
          ]}
          renderItem={(item) => <span className="truncate">{item.label}</span>}
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
      </div>
    </Wrapper>
  );
}

type Upload = SortableListItem & {
  state: "done" | "uploading" | "error";
  progress?: number;
};

/**
 * Attachments in a grid: `tile="bare"` drops the tile's own border and padding, so each
 * `Attachment` is the tile's one frame and keeps its upload and error states. `columns={3}`
 * fixes three tiles a row; the × removes a tile.
 */
export function sortableListAttachments(): ReactNode {
  const [items, setItems] = useState<Upload[]>([
    { id: "front", label: "image 1", state: "done" },
    { id: "side", label: "image 2", state: "done" },
    { id: "back", label: "image 3", state: "uploading", progress: 40 },
    { id: "detail", label: "image 4", state: "error" },
  ]);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-md">
        <SortableList
          aria-label="Images"
          layout="grid"
          columns={3}
          tile="bare"
          items={items}
          renderItem={(item) => (
            <Attachment
              orientation="vertical"
              state={item.state}
              className="w-full"
            >
              <AttachmentMedia variant="image">
                <Image
                  src={PHOTO_SRC.landscape}
                  alt={item.label ?? ""}
                  aspectRatio="square"
                />
              </AttachmentMedia>
              {item.state !== "done" ? (
                <AttachmentContent>
                  <AttachmentDescription>
                    {item.state === "error"
                      ? "Upload failed."
                      : `${item.progress}%`}
                  </AttachmentDescription>
                </AttachmentContent>
              ) : null}
              {item.state === "uploading" ? (
                <AttachmentProgress value={item.progress ?? null} />
              ) : null}
            </Attachment>
          )}
          onRemove={(item) =>
            setItems((prev) => prev.filter((i) => i.id !== item.id))
          }
          onReorder={({ id, to }) =>
            setItems((prev) => applyMove(prev, id, to.index))
          }
        />
      </div>
    </Wrapper>
  );
}
