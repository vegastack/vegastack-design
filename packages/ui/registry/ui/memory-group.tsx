// @vegastack memory-group@0.81.0 sha256-66qRtDSztrduz+QL2eWMMdMJhUXVpO6hns5VsZLiliQ=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatGroup } from "@/components/ui/chat-card";

/** What one turn remembered, as the chat contract carries it (the `data-memory` part). */
export type MemoryGroupData = {
  /** The notebook the notes went to ("Personal memory", "Sales team"). */
  notebook: string;
  /** The notes, each with whether it can still be undone or edited. */
  items: { id: string; text: string; undoable: boolean; editable: boolean }[];
};

/** Props accepted by `MemoryGroup`. */
export interface MemoryGroupProps {
  /** The turn's saved notes. */
  data: MemoryGroupData;
  /** Removes one note. */
  onUndo: (id: string) => void;
  /** Opens one note for editing. */
  onEdit: (id: string) => void;
  /** Whether the fold starts open. @default true */
  defaultOpen?: boolean;
  /** Extra classes on the group's root. @default undefined */
  className?: string;
}

/**
 * What an agent remembered in one turn, as one quiet fold — never a card (G132): "Remembered 3
 * things · Personal memory ⌄", then each note with Undo · Edit. The mark is muted, never green.
 *
 * @example
 * <MemoryGroup data={{ notebook: "Personal memory", items }} onUndo={forget} onEdit={openNote} />
 */
function MemoryGroup({
  data,
  onUndo,
  onEdit,
  defaultOpen = true,
  className,
}: MemoryGroupProps) {
  const count = data.items.length;
  if (count === 0) return null;
  return (
    <div data-slot="memory-group" className={cn("min-w-0", className)}>
      <ChatGroup
        defaultOpen={defaultOpen}
        summary={
          <span className="inline-flex min-w-0 items-center gap-2">
            <Bookmark
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-3.5 shrink-0"
            />
            <span className="min-w-0 truncate">
              Remembered {count === 1 ? "1 thing" : `${count} things`} ·{" "}
              {data.notebook}
            </span>
          </span>
        }
      >
        <ul className="flex min-w-0 flex-col">
          {data.items.map((item) => (
            <li
              key={item.id}
              data-slot="memory-group-item"
              className="-mx-2 flex min-h-7 min-w-0 items-center gap-2 px-2 text-sm"
            >
              <span className="min-w-0 flex-1 text-foreground">
                {item.text}
              </span>
              {item.undoable || item.editable ? (
                <span className="flex shrink-0 items-center text-muted-foreground">
                  {item.undoable ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-muted-foreground"
                      aria-label={`Undo: ${item.text}`}
                      onClick={() => onUndo(item.id)}
                    >
                      Undo
                    </Button>
                  ) : null}
                  {item.undoable && item.editable ? (
                    <span aria-hidden="true">·</span>
                  ) : null}
                  {item.editable ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-muted-foreground"
                      aria-label={`Edit: ${item.text}`}
                      onClick={() => onEdit(item.id)}
                    >
                      Edit
                    </Button>
                  ) : null}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </ChatGroup>
    </div>
  );
}

export { MemoryGroup };
