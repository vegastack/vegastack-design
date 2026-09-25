// @vegastack tool-call-chip@0.23.22 sha256-yxJg0ZnX6hmaVxTQtVvIPakCQMZ7Z43D04KLow28I/o=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------------------------------------
 * ToolCallChip — the agent-activity chip (Wave 3, from the AI-chat teardown): a chip naming a tool
 * action ("SQL query executed") with a muted META slot for its result summary ("3 rows in 495ms").
 *
 * It IS upstream's `Badge` in its `outline` variant, not a private chip recipe. Before Batch 7c of
 * the shadcn reset this file re-derived the whole box — its own height, radius, border, ground and
 * icon rules — which meant a transcript showed two different chip shapes depending on whether the
 * chip happened to be a tool call or a `Badge`. Everything that is still spelled here is what
 * `Badge` does not know about: the label/meta split, the truncation posture (a tool label is long
 * and a badge label is not), and the hover/press steps an INTERACTIVE chip needs, since upstream's
 * `outline` badge only paints a hover for an `<a>`.
 *
 * Polymorphic via Base UI `render`, exactly as `Badge` is, so it can render as a button that
 * expands the call's detail or stay a static span. Compose a leading status icon as `children`
 * before the label — a Spinner while running, a check when done.
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
 *   <Spinner aria-hidden role={undefined} aria-label={undefined} />
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
  return (
    <Badge
      variant="outline"
      render={render}
      ref={ref}
      data-slot="tool-call-chip"
      className={cn(
        // A tool label runs long, so the chip may shrink and truncate; a plain Badge never does.
        "max-w-full min-w-0",
        // Interactive composition (render={<button/>}): upstream's outline badge paints a hover
        // for anchors only, so the button form gets the same two steps explicitly.
        "[&:is(button)]:hover:bg-muted [&:is(button)]:hover:text-muted-foreground [&:is(button)]:active:bg-muted",
        className,
      )}
      {...props}
    >
      {children}
      <span className="min-w-0 truncate">{label}</span>
      {/* NO A11Y-5 separator here, deliberately, although `design.md`'s roster has listed this
          chip as a call site since 2026-09-09. The separator exists for name parts a browser
          would otherwise concatenate flush; these two are children of a flex container, so CSS
          blockifies them and accname step 2F wraps each contribution in spaces of its own. The
          interactive form is named `Search files 1.2s`, which `accessible-name.browser.test.tsx`
          measures with the compiled token CSS loaded — the only realm where that computation is
          honest. Adding a hidden comma on top would name it `Search files , 1.2s`. */}
      {meta != null ? (
        <span
          data-slot="tool-call-chip-meta"
          className="min-w-0 truncate font-normal text-muted-foreground"
        >
          {meta}
        </span>
      ) : null}
    </Badge>
  );
}
