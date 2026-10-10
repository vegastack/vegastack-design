// @vegastack field-grid@0.25.14 sha256-NhwG71leWaZMjnIA0ume3oAw3C3zPqBTT/TEaw7nckM=

import * as React from "react";
import { cn } from "@vegastack/design";

/* ---
`FieldGrid` exists because a form with many short fields (a product's specifications, a
settings page) laid out one per row wastes most of a wide screen and makes the page three
times longer than it needs to be. It follows its CONTAINER's width, not the viewport's, so the
same form reads as one column in a side panel or on a phone, two in a narrow page and three in
a wide one. Long entries (a textarea, a rich description) take the whole row automatically.

`FieldChoices` is the one layout a set of radios or checkboxes needs beyond upstream's stacked
list: a wrapping row, for a short set ("Standard · Custom", three classifications) that reads
better side by side than as a column. It only lays out what it is given — the `RadioGroup`, the
`Checkbox` fields and their `FieldSet` keep all of their own semantics.

Deliberately NOT done: no per-field column spans beyond "full". A grid whose cells span 1, 2 or
3 columns re-flows unpredictably between breakpoints; a field either fits a cell or takes the
row.
--- */

/** Props accepted by `FieldGrid`. */
export interface FieldGridProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The most columns the grid grows to. `3` is one column below 28rem of container width,
   * two from 28rem and three from 48rem; `2` stops at two.
   * @default 3
   */
  columns?: 2 | 3;
}

/**
 * `FieldGrid` — a responsive grid of `Field`s: one, two or three columns by the width of its
 * own container (a container query, so a grid in a narrow panel stays one column on a wide
 * screen). A field holding a `Textarea` takes the whole row by itself; wrap anything else that
 * should in `<FieldGridItem span="full">`.
 *
 * @example
 * <FieldGrid>
 *   <Field>
 *     <FieldLabel htmlFor="width">Width</FieldLabel>
 *     <Input id="width" />
 *   </Field>
 *   <Field>
 *     <FieldLabel htmlFor="notes">Notes</FieldLabel>
 *     <Textarea id="notes" />
 *   </Field>
 * </FieldGrid>
 */
export function FieldGrid({
  columns = 3,
  className,
  children,
  ref,
  ...props
}: FieldGridProps) {
  return (
    <div
      ref={ref}
      data-slot="field-grid"
      data-columns={columns}
      className={cn("@container/field-grid w-full min-w-0", className)}
      {...props}
    >
      <div
        data-slot="field-grid-body"
        className={cn(
          "grid grid-cols-1 items-start gap-x-4 gap-y-5 @md/field-grid:grid-cols-2 *:min-w-0 *:data-[span=full]:col-span-full *:has-[textarea]:col-span-full",
          columns === 3 && "@3xl/field-grid:grid-cols-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Props accepted by `FieldGridItem`. */
export interface FieldGridItemProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * `full` takes the whole row at every width; `auto` takes one cell.
   * @default 'auto'
   */
  span?: "auto" | "full";
}

/**
 * `FieldGridItem` — one cell of a `FieldGrid`, for content that should take the whole row
 * (`span="full"`) or for grouping two controls into one cell. A plain `Field` needs no wrapper.
 *
 * @example
 * <FieldGridItem span="full">
 *   <FieldSet>…</FieldSet>
 * </FieldGridItem>
 */
export function FieldGridItem({
  span = "auto",
  className,
  ref,
  ...props
}: FieldGridItemProps) {
  return (
    <div
      ref={ref}
      data-slot="field-grid-item"
      data-span={span}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

/** Props accepted by `FieldChoices`. */
export interface FieldChoicesProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * `horizontal` sets the choices side by side in a row that wraps; `vertical` stacks them.
   * @default 'vertical'
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * `FieldChoices` — lays out a set of choices: the `Field`s of a checkbox list, or a
 * `RadioGroup` placed directly inside it. `horizontal` is a wrapping row for a short set;
 * `vertical` is upstream's stack. It adds no semantics — keep the `FieldSet` and `FieldLegend`
 * around it that name the set.
 *
 * @example
 * <FieldSet>
 *   <FieldLegend>Type</FieldLegend>
 *   <FieldChoices orientation="horizontal">
 *     <RadioGroup value={type} onValueChange={setType}>
 *       <Field orientation="horizontal">
 *         <RadioGroupItem value="standard" id="standard" />
 *         <FieldLabel htmlFor="standard">Standard</FieldLabel>
 *       </Field>
 *     </RadioGroup>
 *   </FieldChoices>
 * </FieldSet>
 */
export function FieldChoices({
  orientation = "vertical",
  className,
  ref,
  ...props
}: FieldChoicesProps) {
  return (
    <div
      ref={ref}
      data-slot="field-choices"
      data-orientation={orientation}
      className={cn(
        "flex w-full min-w-0",
        orientation === "horizontal"
          ? // A RadioGroup inside is the row itself: it becomes the wrapping flex row, and every
            // choice takes its own width instead of a full-width line.
            "flex-row flex-wrap items-center gap-x-6 gap-y-3 **:data-[slot=field]:w-auto *:data-[slot=radio-group]:flex *:data-[slot=radio-group]:flex-row *:data-[slot=radio-group]:flex-wrap *:data-[slot=radio-group]:items-center *:data-[slot=radio-group]:gap-x-6 *:data-[slot=radio-group]:gap-y-3"
          : "flex-col gap-3",
        className,
      )}
      {...props}
    />
  );
}
