// @vegastack breadcrumb-cascade@0.90.0 sha256-IDGbAbNsSUgWB6XXpnRyuuNajq/5Sd8lcJK8LLpJKag=

"use client";

import * as React from "react";
import { mergeRefs } from "@vegastack/design";
import { BreadcrumbLink } from "@/components/ui/breadcrumb";
import { useDragInto } from "@/components/ui/use-drag-reorder";
import type { BreadcrumbDropTargetProps } from "@/components/ui/breadcrumb-cascade";

/* ---
The drag half of `BreadcrumbDropTarget`, in its own file so the drag code (`useDragInto`) loads
only when a trail renders a drop target. `breadcrumb-cascade.tsx` exports the part and loads this
file the first time one mounts; it is not imported on its own.
--- */

/**
 * `BreadcrumbDropTargetLink` — the loaded drop target: a `BreadcrumbLink` wired to
 * `useDragInto`. Use `BreadcrumbDropTarget` from `breadcrumb-cascade`, which loads it.
 *
 * @example
 * const Lazy = React.lazy(() =>
 *   import("@/components/ui/breadcrumb-drop-target").then((m) => ({
 *     default: m.BreadcrumbDropTargetLink,
 *   })),
 * );
 */
export function BreadcrumbDropTargetLink({
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
      className={className}
      {...props}
    />
  );
}
