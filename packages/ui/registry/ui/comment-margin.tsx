// @vegastack comment-margin@0.23.122 sha256-NfxPY6GC10HXk8e6cRAGohBuZpP9Nzav582nIdtHdC4=

"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

/* ------------------------------------------------------------------------------------------------
 * CommentMargin — comment cards beside the text they are about (Google Docs style)
 * ----------------------------------------------------------------------------------------------*/

/** One card in the margin: where it wants to sit, and what it shows. */
export interface CommentMarginItem {
  /** Stable id — the annotation / thread id. */
  id: string;
  /**
   * The desired top edge in px, in the margin's own coordinates — `TextEdit`'s
   * `onAnnotationsLayout` `top` when the margin's top lines up with the editor root's. `null`
   * (orphaned) is not rendered: list those threads elsewhere.
   */
  top: number | null;
  /** The card — a `CommentThread`, usually. */
  node: React.ReactNode;
}

/** Props for `CommentMargin`. */
export interface CommentMarginProps {
  /** The cards, each with its desired top. */
  items: readonly CommentMarginItem[];
  /**
   * The space kept between two cards, in px.
   * @default 12
   */
  gap?: number;
  /**
   * The active card sits level with its text: earlier cards move up to make room for it.
   * @default null
   */
  activeId?: string | null;
  /** Classes for the margin column. @default undefined */
  className?: string;
}

/**
 * The tops the cards take: in order of their desired tops, each as high as it wants but never
 * over the one before it. With an active card, that card takes exactly its desired top, the
 * cards before it move up out of its way and the ones after it follow it down.
 */
export function layoutCommentMargin(
  items: readonly { id: string; top: number; height: number }[],
  gap: number,
  activeId: string | null,
): Map<string, number> {
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const tops = sorted.map((item) => item.top);
  for (let i = 1; i < sorted.length; i++)
    tops[i] = Math.max(tops[i]!, tops[i - 1]! + sorted[i - 1]!.height + gap);
  const active = sorted.findIndex((item) => item.id === activeId);
  if (active !== -1 && tops[active]! !== sorted[active]!.top) {
    tops[active] = sorted[active]!.top;
    for (let i = active - 1; i >= 0; i--)
      tops[i] = Math.min(tops[i]!, tops[i + 1]! - gap - sorted[i]!.height);
    for (let i = active + 1; i < sorted.length; i++)
      tops[i] = Math.max(
        sorted[i]!.top,
        tops[i - 1]! + sorted[i - 1]!.height + gap,
      );
  }
  return new Map(sorted.map((item, index) => [item.id, tops[index]!]));
}

/**
 * `CommentMargin` — a column of comment cards laid beside the text they are about: each card sits
 * level with its highlight, pushed down just enough not to overlap the card above; the active
 * card sits exactly level with its text and the cards above it move up (Google Docs behaviour).
 * Heights are measured live, so a card that grows (a reply box opening) re-flows the rest.
 * Cards whose `top` is `null` (their text is gone) are not rendered.
 *
 * @example
 * <CommentMargin activeId={activeId}
 *   items={layout.map((l) => ({ id: l.id, top: l.top, node: <CommentThread … /> }))} />
 */
export function CommentMargin({
  items,
  gap = 12,
  activeId = null,
  className,
}: CommentMarginProps) {
  const [heights, setHeights] = React.useState<Record<string, number>>({});
  const nodes = React.useRef(new Map<string, HTMLElement>());
  const observer = React.useRef<ResizeObserver | null>(null);

  const measure = React.useCallback(() => {
    setHeights((previous) => {
      let changed = false;
      const next: Record<string, number> = {};
      for (const [id, node] of nodes.current) {
        next[id] = node.offsetHeight;
        if (previous[id] !== next[id]) changed = true;
      }
      if (Object.keys(previous).length !== Object.keys(next).length)
        changed = true;
      return changed ? next : previous;
    });
  }, []);

  React.useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(measure);
    for (const node of nodes.current.values()) observer.current.observe(node);
    return () => observer.current?.disconnect();
  }, [measure]);

  const register = React.useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      const previous = nodes.current.get(id);
      if (previous && previous !== node) observer.current?.unobserve(previous);
      if (node) {
        nodes.current.set(id, node);
        observer.current?.observe(node);
      } else nodes.current.delete(id);
    },
    [],
  );

  // Measure before paint whenever the set of cards changes.
  const ids = items
    .filter((item) => item.top !== null)
    .map((item) => item.id)
    .join("|");
  React.useLayoutEffect(measure, [ids, measure]);

  const placed = items.filter(
    (item): item is CommentMarginItem & { top: number } => item.top !== null,
  );
  const tops = layoutCommentMargin(
    placed.map((item) => ({
      id: item.id,
      top: item.top,
      height: heights[item.id] ?? 0,
    })),
    gap,
    activeId,
  );
  const bottom = placed.reduce(
    (max, item) =>
      Math.max(max, (tops.get(item.id) ?? 0) + (heights[item.id] ?? 0)),
    0,
  );

  return (
    <div
      data-slot="comment-margin"
      className={cn("relative min-w-0", className)}
      style={{ minHeight: bottom }}
    >
      {placed.map((item) => (
        <div
          key={item.id}
          ref={register(item.id)}
          data-slot="comment-margin-item"
          data-active={item.id === activeId ? "" : undefined}
          className="absolute inset-x-0 transition-[top] duration-150 ease-out"
          style={{ top: tops.get(item.id) ?? item.top }}
        >
          {item.node}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentPopover — the same thread beside a highlight, on screens too narrow for a margin
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CommentPopover`. */
export interface CommentPopoverProps {
  /**
   * The highlight's box in viewport coordinates — the popover anchors to it. `null` closes it.
   */
  anchorRect: DOMRect | null;
  /** Whether it shows. */
  open: boolean;
  /** Called when it opens or closes (Escape, a click outside). */
  onOpenChange: (open: boolean) => void;
  /** The content — a `CommentThread`, usually. */
  children: React.ReactNode;
  /** Classes for the popup. @default undefined */
  className?: string;
}

/**
 * `CommentPopover` — a comment thread in a popover anchored to its highlight, for widths where no
 * margin fits beside the text. On touch-sized screens use `Sheet side="bottom"` instead.
 *
 * @example
 * <CommentPopover open={!!active} onOpenChange={(open) => !open && setActive(null)}
 *   anchorRect={activeRect}>
 *   <CommentThread thread={activeThread} onReply={reply} />
 * </CommentPopover>
 */
export function CommentPopover({
  anchorRect,
  open,
  onOpenChange,
  children,
  className,
}: CommentPopoverProps) {
  const themeScope = useInternalThemeScope();
  const rectRef = React.useRef(anchorRect);
  rectRef.current = anchorRect;
  const anchor = React.useMemo(
    () => ({
      getBoundingClientRect: () => rectRef.current ?? new DOMRect(0, 0, 0, 0),
    }),
    [],
  );
  return (
    <PopoverPrimitive.Root
      open={open && anchorRect !== null}
      onOpenChange={(next) => onOpenChange(next)}
    >
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchor}
          side="bottom"
          align="start"
          sideOffset={6}
          className={cn("isolate z-50", themeScope)}
        >
          <PopoverPrimitive.Popup
            data-slot="comment-popover"
            aria-label="Comment thread"
            className={cn(
              "z-50 w-80 max-w-[calc(100vw-1rem)] origin-(--transform-origin) outline-hidden duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              className,
            )}
          >
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
