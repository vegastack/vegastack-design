// @vegastack tool-call-chip@0.4.0 sha256-oLhgbEL4CRalQiR9qnx928g9FWtX72czc8WzUY51ZPY=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * ToolCallChip — the agent-activity chip (Wave 3, from the AI-chat teardown): an outline chip
 * naming a tool action ("SQL query executed") with a muted META slot for its result summary
 * ("3 rows in 495ms"). Chat-family presentational; polymorphic via Base UI `useRender`, so it
 * can render as a button (expand the call's detail) or stay a static span. Compose a leading
 * status icon as `children` before the label — a Spinner while running, a check when done.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ToolCallChip`. */
export interface ToolCallChipProps extends React.ComponentPropsWithRef<"span"> {
  /** The action label — ink voice ("Attributes searched"). */
  label: React.ReactNode;
  /** Muted result meta after the label ("2 results", "3 rows in 495ms"). @default undefined */
  meta?: React.ReactNode;
  /**
   * Render the chip as a different element (e.g. `render={<button />}` when the
   * chip expands the call's detail) via Base UI `render` composition.
   * @default undefined
   */
  render?: useRender.RenderProp;
}

/**
 * `ToolCallChip` — one tool invocation in an agent transcript.
 *
 * @example
 * <ToolCallChip label="SQL query executed" meta="3 rows in 495ms">
 *   <Database aria-hidden />
 * </ToolCallChip>
 *
 * @example
 * // running state: spinner + no meta yet
 * <ToolCallChip label="Searching attributes…">
 *   <Spinner size="inherit" label="" />
 * </ToolCallChip>
 */
export function ToolCallChip({
  className,
  label,
  meta,
  render,
  children,
  ref,
  ...props
}: ToolCallChipProps) {
  return useRender({
    render: render ?? <span />,
    defaultTagName: "span",
    ref,
    props: {
      "data-slot": "tool-call-chip",
      className: cn(
        "inline-flex h-(--size-sm) w-fit max-w-full min-w-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-label-sm text-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-inline) [&_svg]:text-muted-foreground",
        // Interactive composition (render={<button/>}): hover + press follow the ghost grammar.
        "[&:is(button)]:hover:bg-muted",
        className,
      ),
      children: (
        <>
          {children}
          <span className="min-w-0 truncate">{label}</span>
          {meta != null ? (
            <span
              data-slot="tool-call-chip-meta"
              className="min-w-0 truncate font-normal text-muted-foreground"
            >
              {meta}
            </span>
          ) : null}
        </>
      ),
      ...props,
    },
  });
}
