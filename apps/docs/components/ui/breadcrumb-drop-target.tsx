// @vegastack breadcrumb-cascade@0.135.0 sha256-idTVGDvXhB85JLdamjf+bD8KAe5xAt5rsaCOvS/pBXE=

"use client";

import * as React from "react";
import { useDragInto } from "@/components/ui/use-drag-reorder";
import type {
  BreadcrumbDropState,
  BreadcrumbDropWiringProps,
} from "@/components/ui/breadcrumb-cascade";

/* ---
The drag half of `BreadcrumbDropTarget`, in its own file so the drag code (`useDragInto`) loads
only when a trail renders a drop target. `breadcrumb-cascade.tsx` loads it the first time one
mounts; it renders nothing and wires the link that part already rendered, so the element (and any
focus on it) never changes. It is not used on its own.
--- */

/**
 * `BreadcrumbDropWiring` — makes `node` a `useDragInto` drop target and reports its drop state
 * through `onState`. Rendered by `BreadcrumbDropTarget`; use that part.
 *
 * @example
 * <BreadcrumbDropWiring node={link} targetId="1" dragScope="library" onDropInto={move} onState={setState} />
 */
export function BreadcrumbDropWiring({
  node,
  targetId,
  dragScope,
  onDropInto,
  canDropInto,
  onState,
}: BreadcrumbDropWiringProps) {
  const into = useDragInto({
    scope: dragScope,
    canDrop: ({ ids, targetKey }) =>
      canDropInto?.({ ids, targetId: targetKey }) ?? true,
    onDrop: ({ ids, targetKey }) => {
      void onDropInto({ ids, targetId: targetKey });
    },
  });
  const {
    ref: dropRef,
    "data-dragging": dragging,
    "data-drop-over": over,
    "data-drop-invalid": invalid,
  } = into.getItemProps(targetId, { drop: "whole" });
  React.useLayoutEffect(() => {
    dropRef(node);
    return () => dropRef(null);
  }, [dropRef, node]);
  React.useLayoutEffect(() => {
    const state: BreadcrumbDropState = {};
    if (dragging !== undefined) state["data-dragging"] = "";
    if (over !== undefined) state["data-drop-over"] = "";
    if (invalid !== undefined) state["data-drop-invalid"] = "";
    onState(state);
  }, [dragging, over, invalid, onState]);
  return null;
}
