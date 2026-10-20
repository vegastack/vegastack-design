// @vegastack value-change@0.25.49 sha256-Ov0JGkDurcpA2UXQ4jWXS2WVrJ9ERyhZqAUCyrWQhro=

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@vegastack/design";

/* ---
`ValueChange` exists because "this field went from A to B" turns up in every activity feed,
audit log, impact review and version note, and each surface was hand-rolling it: a struck
old value, an arrow, the new one, in whatever colours were nearby. It is the inline,
single-value sibling of `DiffView`, which compares whole texts.

Three judgments, each pinned by a test:
- the semantics are real `<del>`/`<ins>`, so the change survives copy, reader mode and
  assistive tech that announces edits;
- the arrow is decoration (`aria-hidden`) and the sentence is spoken instead — "changed
  from A to B", "added B", "removed A" — through sr-only connectives around the visible
  values, so a value is never rendered twice;
- an absent side (`null`, `undefined`, a boolean, `""`) is not drawn at all. A one-sided
  change is an addition or a removal, not a change to or from an empty box.
--- */

/** What a `ValueChange` resolved to, reflected as `data-change`. */
export type ValueChangeKind = "changed" | "added" | "removed";

/** Props accepted by `ValueChange`. */
export interface ValueChangeProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /**
   * The old value, struck through in the destructive ink. `null` (or omitted) when the
   * value was added rather than changed.
   * @default undefined
   */
  before?: React.ReactNode;
  /**
   * The new value, in the success ink. `null` (or omitted) when the value was removed.
   * @default undefined
   */
  after?: React.ReactNode;
}

function present(value: React.ReactNode): boolean {
  // React renders booleans as nothing, so `true` is as absent as `false`.
  return (
    value !== null &&
    value !== undefined &&
    typeof value !== "boolean" &&
    value !== ""
  );
}

/**
 * `ValueChange` — an inline before → after diff of one value: the old value in a `<del>`
 * (struck, destructive ink), a muted arrow, the new value in an `<ins>` (success ink, no
 * underline). Only `after` renders an addition, only `before` a removal, and neither renders
 * nothing. Screen readers hear "changed from A to B", "added B" or "removed A".
 *
 * @example
 * <ValueChange before="Draft" after="Published" />
 */
export function ValueChange({
  before,
  after,
  className,
  ...props
}: ValueChangeProps) {
  const hasBefore = present(before);
  const hasAfter = present(after);
  if (!hasBefore && !hasAfter) return null;

  const kind: ValueChangeKind =
    hasBefore && hasAfter ? "changed" : hasAfter ? "added" : "removed";

  return (
    <span
      data-slot="value-change"
      data-change={kind}
      className={cn(
        "inline-flex max-w-full min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5",
        className,
      )}
      {...props}
    >
      {hasBefore ? (
        <>
          <span className="sr-only">
            {kind === "changed" ? "changed from " : "removed "}
          </span>
          <del
            data-slot="value-change-before"
            className="min-w-0 break-words text-destructive-text line-through"
          >
            {before}
          </del>
        </>
      ) : null}
      {kind === "changed" ? (
        <ArrowRight
          aria-hidden
          data-slot="value-change-arrow"
          className="size-3.5 shrink-0 self-center text-muted-foreground rtl:rotate-180"
        />
      ) : null}
      {hasAfter ? (
        <>
          <span className="sr-only">
            {kind === "changed" ? " to " : "added "}
          </span>
          <ins
            data-slot="value-change-after"
            className="min-w-0 break-words text-success-text no-underline"
          >
            {after}
          </ins>
        </>
      ) : null}
    </span>
  );
}
