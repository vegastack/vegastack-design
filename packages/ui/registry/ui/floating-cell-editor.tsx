// @vegastack floating-cell-editor@0.25.105 sha256-SItKjJH60ZuXpmc3fS5hEhD5ghKvm7QC/lJtER2wybs=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

/* ---
`FloatingCellEditor` is a grid cell's editor as its own floating surface, spawned at the cell: the
cell keeps drawing its resting face and the editor opens over it, so editing never moves a row or a
column. While it is open the page is locked — a full-window layer takes every press and wheel, so
the first click anywhere only closes the editor and nothing scrolls under it.

Deliberately NOT done here:
- No editing. The children are the editor (a `FieldCellEditor`, a picker, a file dialog); they
  commit and cancel themselves. This only places them and holds the page still.
- No scroll following. The page cannot scroll while the editor is open; a window resize (a
  browser zoom) re-places it.
--- */

/**
 * How wide the floating editor is at least. `cell` is the cell's own width; `text` suits text,
 * links, e-mail and people (280px); `wide` long text, a date-time or a file list (340px); `picker` a picker's trigger
 * that shows a name or a date (184px). Never wider than `maxWidth`.
 */
export type FloatingCellEditorSize = "cell" | "text" | "wide" | "picker";

const MIN_WIDTH: Record<FloatingCellEditorSize, number> = {
  cell: 0,
  text: 280,
  wide: 340,
  picker: 184,
};

/** The widest a floating editor grows. */
const MAX_WIDTH = 480;
/** How far the editor reaches past the cell on every side, so the cell's own fill never shows. */
const BLEED = 2;
/** How long after it opens a press on the lock is taken for the end of a double-click. */
const SETTLE_MS = 350;

/**
 * The size a `FieldType` ("text", "datetime", "person"…) edits at: text-like types and people
 * grow, long text, a date-time and files are wide, pickers keep to their trigger, anything else is
 * the cell's width.
 */
export function floatingCellEditorSize(type: string): FloatingCellEditorSize {
  switch (type) {
    case "text":
    case "url":
    case "email":
    case "phone":
    case "person":
      return "text";
    case "long_text":
    case "datetime":
    case "file":
      return "wide";
    case "date":
    case "single_choice":
    case "multi_choice":
    case "link":
      return "picker";
    default:
      return "cell";
  }
}

type Anchor = { left: number; top: number; width: number; height: number };

/**
 * The full-window layer behind an open editor: it takes the click that closes it, and the wheel.
 * A pinch is left alone — a trackpad's arrives as a wheel with the ctrl key, a screen's as two
 * touches — and so is a one-finger drag while the page is zoomed in, so the zoom (and moving about
 * in it) always works while the page itself stays still.
 */
function Lock({ onDismiss }: { onDismiss?: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  // The click that opened the editor may be the first half of a double-click: its second press
  // lands here, and must neither take focus off the editor nor close it.
  const since = React.useRef(0);
  React.useEffect(() => {
    since.current = performance.now();
    const node = ref.current;
    if (!node) return;
    const holdWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) event.preventDefault();
    };
    const holdTouch = (event: TouchEvent) => {
      if (event.touches.length > 1 || (window.visualViewport?.scale ?? 1) > 1)
        return;
      event.preventDefault();
    };
    node.addEventListener("wheel", holdWheel, { passive: false });
    node.addEventListener("touchmove", holdTouch, { passive: false });
    return () => {
      node.removeEventListener("wheel", holdWheel);
      node.removeEventListener("touchmove", holdTouch);
    };
  }, []);
  const themeScope = useInternalThemeScope();
  const settling = () => performance.now() - since.current < SETTLE_MS;
  const own = (event: React.SyntheticEvent) => event.stopPropagation();
  return createPortal(
    <div
      ref={ref}
      aria-hidden
      data-slot="floating-cell-editor-lock"
      className={cn("fixed inset-0 z-40", themeScope)}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (!settling()) onDismiss?.();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        // Focus stays in the editor: leaving it is what saves a typed draft.
        if (settling()) event.preventDefault();
      }}
      onClick={own}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    />,
    document.body,
  );
}

/** Props accepted by `FloatingCellEditor`. */
export interface FloatingCellEditorProps {
  /** The cell as it rests: it keeps drawing while its editor floats over it. */
  face: React.ReactNode;
  /** The editor. It commits and cancels itself. */
  children: React.ReactNode;
  /**
   * How wide the editor is at least (`floatingCellEditorSize` maps a field type to one).
   * @default "cell"
   */
  size?: FloatingCellEditorSize;
  /**
   * The press on the lock that closes an editor which has no commit of its own on leaving — a
   * picker that saves when something is chosen, a file dialog. Leave it unset for an editor that
   * saves a draft when focus leaves it: the press blurs it, and that saves.
   * @default undefined
   */
  onDismiss?: () => void;
  /**
   * The editor surface's extra classes.
   * @default undefined
   */
  className?: string;
}

/**
 * `FloatingCellEditor` — a grid cell's editor floating over the cell: anchored at the cell's
 * rectangle, reaching 2px past it on every side, at least as tall as the cell and as wide as
 * `size` says (never over 480px), with the page locked behind it. Place it inside the cell: the
 * cell it anchors to is the nearest `data-slot="data-grid-cell"`, `td` or `role="gridcell"`
 * around it. A `DataGrid` with `editing="floating"` does this for its `custom` editors.
 *
 * @example
 * <FloatingCellEditor face={<FieldCellDisplay type="text" value={value} />} size="text">
 *   <FieldCellEditor variant="cell" type="text" label="Name" value={value} onCommit={save} onCancel={close} />
 * </FloatingCellEditor>
 */
export function FloatingCellEditor({
  face,
  children,
  size = "cell",
  onDismiss,
  className,
}: FloatingCellEditorProps) {
  const host = React.useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = React.useState<Anchor | null>(null);
  React.useLayoutEffect(() => {
    const node = host.current;
    const cell =
      node?.closest<HTMLElement>(
        '[data-slot="data-grid-cell"], td, [role="gridcell"]',
      ) ?? node?.parentElement;
    if (!cell) return;
    const place = () => {
      const r = cell.getBoundingClientRect();
      setAnchor({
        left: r.left - BLEED,
        top: r.top - BLEED,
        width: r.width + BLEED * 2,
        height: r.height + BLEED * 2,
      });
    };
    place();
    // A browser zoom reflows the page under the open editor: it follows its cell.
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);
  const width = anchor
    ? Math.min(MAX_WIDTH, Math.max(anchor.width, MIN_WIDTH[size]))
    : undefined;
  return (
    <>
      <span
        ref={host}
        data-slot="floating-cell-editor-face"
        className="contents"
      >
        {face}
      </span>
      {anchor ? (
        <>
          <Lock onDismiss={onDismiss} />
          {/* Open for as long as the editor is mounted: the editor itself decides when it is done. */}
          <Popover open>
            <PopoverAnchor
              render={
                <span
                  className="pointer-events-none fixed top-(--anchor-top) left-(--anchor-left) h-(--anchor-height) w-(--anchor-width)"
                  style={
                    {
                      "--anchor-top": `${anchor.top}px`,
                      "--anchor-left": `${anchor.left}px`,
                      "--anchor-width": `${anchor.width}px`,
                      "--anchor-height": `${anchor.height}px`,
                    } as React.CSSProperties
                  }
                />
              }
            />
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={-anchor.height}
              initialFocus={false}
              finalFocus={false}
              className={cn(
                "z-50 min-h-(--editor-min-height) w-(--editor-width) gap-0 bg-popover p-0 shadow-lg",
                className,
              )}
              style={
                {
                  "--editor-width": `${width}px`,
                  "--editor-min-height": `${anchor.height}px`,
                } as React.CSSProperties
              }
            >
              {children}
            </PopoverContent>
          </Popover>
        </>
      ) : null}
    </>
  );
}
