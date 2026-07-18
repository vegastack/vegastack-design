// @vegastack resizable@0.1.0 sha256-kgU0atnjSv2Svdz80pl9w4TACn30pxAGG6a2G3hKwkE=

"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * Resizable — draggable/keyboard-resizable split panes, built on the headless `react-resizable-panels`
 * v4 engine (the sanctioned non-Base-UI primitive alongside `message-scroller`; Base UI has no
 * split-pane equivalent). v4 renamed its exports to `Group` / `Panel` / `Separator` (NOT the
 * `PanelGroup` / `Panel` / `PanelResizeHandle` names older shadcn snippets reference) and moved
 * layout entirely into the `Group`'s own inline styles — `ResizablePanelGroup` therefore needs no
 * `flex`/`flex-col` classes of its own, unlike the legacy shadcn recipe.
 *
 * `Separator` reports `aria-orientation` as the axis PERPENDICULAR to the group's `orientation`
 * (a vertical divider bar between horizontally arranged panels, per the ARIA separator role) — the
 * classes below key off that `aria-orientation`, not the group's `orientation` prop.
 * ----------------------------------------------------------------------------------------------*/

export interface ResizablePanelGroupProps extends ResizablePrimitive.GroupProps {
  /** Ref to the root `HTMLDivElement`. */
  ref?: React.Ref<HTMLDivElement | null>;
}

/**
 * `ResizablePanelGroup` — the flex container for a set of `ResizablePanel`s and
 * `ResizableHandle`s. Lay panels out side-by-side with `orientation="horizontal"`
 * (the default) or stacked with `orientation="vertical"`; the underlying `Group`
 * sets `display: flex` + `flex-direction` itself, so no layout classes are needed.
 *
 * The group fills its parent at `height: 100%; width: 100%` (also set by the
 * primitive, and not overridable) — give the parent element an explicit height
 * (e.g. `className="h-96"` on a wrapper), or panels collapse to zero height.
 *
 * @example
 * // Percentages are unitless STRINGS ("30" = 30%) — a bare number like `defaultSize={30}`
 * // means 30 PIXELS instead, per the underlying `react-resizable-panels` v4 convention.
 * // The bounded height lives on the PARENT wrapper — the group's own inline
 * // `height: 100%` overrides any `h-*` class set on the group itself.
 * <div className="h-64">
 *   <ResizablePanelGroup orientation="horizontal" className="rounded-lg border">
 *     <ResizablePanel defaultSize="30" minSize="20">Sidebar</ResizablePanel>
 *     <ResizableHandle withHandle />
 *     <ResizablePanel>Content</ResizablePanel>
 *   </ResizablePanelGroup>
 * </div>
 */
export function ResizablePanelGroup({ className, ref, ...props }: ResizablePanelGroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      elementRef={ref}
      className={cn(className)}
      {...props}
    />
  );
}

export interface ResizablePanelProps extends ResizablePrimitive.PanelProps {
  /** Ref to the root `HTMLDivElement`. */
  ref?: React.Ref<HTMLDivElement | null>;
}

/**
 * `ResizablePanel` — one resizable region within a `ResizablePanelGroup`. Constrain
 * it with `minSize`/`maxSize`/`defaultSize` (percentages by default; suffix with
 * `px`/`em`/`rem`/`vh`/`vw` for other units), or make it `collapsible` down to
 * `collapsedSize` (0% by default) — pair with `panelRef` for imperative
 * `collapse()`/`expand()`/`isCollapsed()`/`resize()`/`getSize()` control.
 *
 * A panel is unstyled by default (no padding/overflow handling) so it composes
 * with any content; add `className="overflow-auto p-4"` etc. as needed.
 */
export function ResizablePanel({ ref, ...props }: ResizablePanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" elementRef={ref} {...props} />;
}

export interface ResizableHandleProps extends ResizablePrimitive.SeparatorProps {
  /**
   * Render a small visible grip glyph centered on the handle, for a clearer
   * drag affordance. The bar itself is always the drag/keyboard target either way.
   * @default false
   */
  withHandle?: boolean;
  /** Ref to the root `HTMLDivElement`. */
  ref?: React.Ref<HTMLDivElement | null>;
}

/**
 * `ResizableHandle` — the draggable divider between two `ResizablePanel`s. Renders
 * `role="separator"` with `aria-valuenow`/`-min`/`-max` reflecting the adjacent
 * panel's size, is focusable (`Tab`) and keyboard-operable (`ArrowLeft`/`ArrowRight`
 * or `ArrowUp`/`ArrowDown` depending on axis, plus `Home`/`End` to jump to the
 * panel's size extremes) out of the box — no extra wiring needed.
 *
 * Resting state is a 1px `bg-border` line; it fills `bg-primary` on hover, drag,
 * or keyboard focus (mirrored via the primitive's own `data-separator` state, so
 * touch/keyboard interactions get the same feedback as a pointer hover), and dims
 * to `--opacity-dim` with the cursor reset when `disabled`. The centralized
 * `base.css` `:focus-visible` outline (no ring of its own — same convention as
 * `Slider`/`Separator`) supplies the focus affordance.
 *
 * @example
 * // Grip glyph for a clearer drag affordance
 * <ResizableHandle withHandle />
 */
export function ResizableHandle({ withHandle = false, className, ref, ...props }: ResizableHandleProps) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      elementRef={ref}
      className={cn(
        // Base: a thin neutral line, centered flex item, that fills with `bg-primary`
        // on hover / drag / keyboard-focus (the primitive's own hit-test state, exposed
        // as `data-separator`) and dims when `aria-disabled`. `group/handle` lets the
        // grip glyph below react to this element's own `aria-orientation`.
        "group/handle relative flex shrink-0 touch-none items-center justify-center bg-border transition-colors duration-fast ease-standard select-none hover:bg-primary focus-visible:bg-primary data-[separator=active]:bg-primary aria-disabled:pointer-events-none aria-disabled:opacity-(--opacity-dim)",
        // Default (aria-orientation="vertical" — a vertical bar between horizontally
        // arranged panels): full height, 1px wide, column-resize cursor. A wider
        // invisible `after` hit target (8px) keeps the drag/tap target comfortable
        // without widening the visible line.
        "h-full w-px cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2",
        // aria-orientation="horizontal" (a horizontal bar between vertically stacked
        // panels): mirror every rule onto the cross axis.
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:inset-y-auto aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:h-2 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-(--z-raised) flex size-4 items-center justify-center rounded-xs border bg-border group-aria-[orientation=horizontal]/handle:rotate-90">
          <GripVertical className="size-(--icon-compact) text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
}
