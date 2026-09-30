// @vegastack breadcrumb-cascade@0.23.85 sha256-ejq1RScMRM6Gcue61Te8qe7iCq2AQsNbkpP3ibo0gDM=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn, mergeRefs } from "@vegastack/design";
import { Check, ChevronDown } from "lucide-react";
import { BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDragInto } from "@/components/ui/use-drag-reorder";

/* ---
`breadcrumb-cascade` adds two things to a breadcrumb trail that a file browser needs, without
touching upstream's `breadcrumb`: a segment that takes dropped rows (`BreadcrumbDropTarget`), and a
menu of a segment's siblings (`BreadcrumbSiblings`, after vegastack-pages' `BreadcrumbCascade`).
`breadcrumb.tsx` is upstream's file plus a patch whose every hunk names a decision marked
**ours**; new props there would need a new decision row, so both parts compose its parts instead.
--- */

/** A drop of dragged rows onto a breadcrumb segment — what `onDropInto` receives. */
export interface BreadcrumbDropMove {
  /** The dragged row ids (a `DataList` drag carries its whole selection). */
  ids: string[];
  /** The segment's `targetId`. */
  targetId: string;
}

/** Props accepted by `BreadcrumbDropTarget`. */
export interface BreadcrumbDropTargetProps extends useRender.ComponentProps<"a"> {
  /** The segment's id — the folder rows dropped here move into. */
  targetId: string;
  /** The drag scope of the list whose rows may drop here (`DataList`'s `dragScope`). */
  dragScope: string;
  /** Called for a valid drop. Return a promise for a server-gated move. */
  onDropInto: (move: BreadcrumbDropMove) => void | Promise<void>;
  /**
   * Whether the drop is allowed — rows already in this folder, or a folder dropped into its own
   * descendant. A refused segment shows `data-drop-invalid` and takes nothing.
   * @default undefined
   */
  canDropInto?: (move: BreadcrumbDropMove) => boolean;
}

/**
 * `BreadcrumbDropTarget` — a breadcrumb link that rows dragged from a `DataList` (or any
 * `useDragInto` source in the same `dragScope`) can be dropped on: moving items up to a parent
 * folder by dropping them on its crumb. It renders `BreadcrumbLink`, so it is still the link it
 * was; while a drag is over it, it washes in the primary tint (`data-drop-over`), or the
 * destructive tint when it refuses (`data-drop-invalid`). Pointer only — the keyboard path is the
 * host's "Move…" action.
 *
 * @example
 * <BreadcrumbItem>
 *   <BreadcrumbDropTarget
 *     href="/library/f/1"
 *     targetId="1"
 *     dragScope="library"
 *     onDropInto={({ ids, targetId }) => moveItems(ids, targetId)}
 *   >
 *     Projects
 *   </BreadcrumbDropTarget>
 * </BreadcrumbItem>
 */
export function BreadcrumbDropTarget({
  targetId,
  dragScope,
  onDropInto,
  canDropInto,
  className,
  ref,
  ...props
}: BreadcrumbDropTargetProps) {
  const into = useDragInto({
    scope: dragScope,
    canDrop: ({ ids, targetKey }) =>
      canDropInto?.({ ids, targetId: targetKey }) ?? true,
    onDrop: ({ ids, targetKey }) => {
      void onDropInto({ ids, targetId: targetKey });
    },
  });
  const { ref: dropRef, ...dropState } = into.getItemProps(targetId, {
    drop: "whole",
  });
  const mergedRef = React.useMemo(
    () => mergeRefs(dropRef, ref),
    [dropRef, ref],
  );
  return (
    <BreadcrumbLink
      ref={mergedRef}
      data-drop-target=""
      {...dropState}
      className={cn(
        // The drop wash needs a little room around the text, so the crumb carries it always:
        // the -mx-1 keeps the trail's spacing where it was.
        "-mx-1 rounded-sm px-1 data-drop-invalid:bg-destructive/10 data-drop-over:bg-primary/10 data-drop-over:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** One entry in a `BreadcrumbSiblings` menu. */
export interface BreadcrumbSibling {
  /** A stable id, passed to `onSelect`. */
  id: string;
  /** The entry's name. */
  label: string;
  /** Where the entry goes. Without it, choosing the entry only calls `onSelect`. */
  href?: string;
  /** A leading icon (a folder or a file kind). */
  icon?: React.ReactNode;
  /** The segment the menu belongs to — marked with a check and `aria-current`. */
  current?: boolean;
}

/** Props accepted by `BreadcrumbSiblings`. */
export interface BreadcrumbSiblingsProps {
  /** The segment's siblings, the segment itself included (mark it `current`). */
  items: readonly BreadcrumbSibling[];
  /** The segment's name — the menu trigger's and the menu's accessible names are built from it. */
  label: string;
  /**
   * Called with an entry's id when it is chosen (after its link, when it has one).
   * @default undefined
   */
  onSelect?: (id: string) => void;
  /**
   * Called when the menu opens or closes — load the siblings on first open.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The siblings are loading: the menu shows `loadingMessage` in place of the entries.
   * @default false
   */
  loading?: boolean;
  /**
   * The element an entry's link renders — a router link such as `<Link />`.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * The trigger's accessible name.
   * @default (label) => `Items next to ${label}`
   */
  triggerLabel?: (label: string) => string;
  /**
   * Shown while `loading`.
   * @default "Loading…"
   */
  loadingMessage?: string;
  /**
   * Shown when there is nothing to list.
   * @default "Nothing else here"
   */
  emptyMessage?: string;
  /**
   * Extra classes on the trigger.
   * @default undefined
   */
  className?: string;
}

/**
 * `BreadcrumbSiblings` — a small chevron after a breadcrumb segment that opens a menu of the
 * segment's siblings, so a reader can jump sideways (another folder at the same level) without
 * going up first. The segment's own link is untouched; the menu is the DS `DropdownMenu`, so it
 * opens with Enter, Space or ↓ and moves with the arrow keys and type-ahead. Put it inside the
 * segment's `BreadcrumbItem`, after its link.
 *
 * @example
 * <BreadcrumbItem>
 *   <BreadcrumbLink href="/library/f/2">Projects</BreadcrumbLink>
 *   <BreadcrumbSiblings
 *     label="Projects"
 *     items={[
 *       { id: "1", label: "Clients", href: "/library/f/1" },
 *       { id: "2", label: "Projects", href: "/library/f/2", current: true },
 *     ]}
 *   />
 * </BreadcrumbItem>
 */
export function BreadcrumbSiblings({
  items,
  label,
  onSelect,
  onOpenChange,
  loading = false,
  linkRender,
  triggerLabel = (name) => `Items next to ${name}`,
  loadingMessage = "Loading…",
  emptyMessage = "Nothing else here",
  className,
}: BreadcrumbSiblingsProps) {
  return (
    <DropdownMenu onOpenChange={(open) => onOpenChange?.(open)}>
      <DropdownMenuTrigger
        data-slot="breadcrumb-siblings-trigger"
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={triggerLabel(label)}
            className={cn("text-muted-foreground", className)}
          />
        }
      >
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-slot="breadcrumb-siblings-menu"
        aria-busy={loading || undefined}
        className="max-h-80 min-w-48"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
          {loading ? (
            <DropdownMenuItem disabled data-slot="breadcrumb-siblings-status">
              {loadingMessage}
            </DropdownMenuItem>
          ) : items.length === 0 ? (
            <DropdownMenuItem disabled data-slot="breadcrumb-siblings-status">
              {emptyMessage}
            </DropdownMenuItem>
          ) : (
            items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                data-slot="breadcrumb-siblings-item"
                data-current={item.current ? "" : undefined}
                aria-current={item.current ? "page" : undefined}
                onClick={() => onSelect?.(item.id)}
                render={
                  item.href !== undefined
                    ? React.cloneElement(linkRender ?? <a />, {
                        href: item.href,
                      })
                    : undefined
                }
              >
                {item.icon}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.current ? <Check aria-hidden="true" /> : null}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
