// @vegastack property-list@0.23.103 sha256-6MhQCy03eESuvCvaM5zLr2SppGo/6SnyaYTHV76UVSw=

import * as React from "react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * PropertyList — record-facts rows (Wave 2c, from the app-teardown facts-pane anatomy): an
 * icon + muted 12/500 label column beside a 14/500 value column, one row per attribute. Built as
 * a definition list (`<dl>/<dt>/<dd>`) so the label→value relationship is announced without extra
 * wiring. Server-safe, purely presentational — values are whatever you compose (text, a link,
 * a `TagGroup`, a muted placeholder span). Verified NOT a `DataList` fit: DataList is a `<table>` renderer
 * for homogeneous collections; PropertyList is the heterogeneous key→value pane.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `PropertyList`. */
export interface PropertyListProps extends React.ComponentPropsWithRef<"dl"> {
  /**
   * `stacked` — the label column beside the value, stacking when the pane is narrow. `inline` —
   * the record-aside row for a narrow rail card: a fixed 112px label column (a long label
   * truncates, its full text in the tooltip), so every value starts at the same x, left-aligned,
   * as in Linear or Notion; its editable values are quiet pickers — `RecordChip variant="ghost"`.
   * @default "stacked"
   */
  variant?: "stacked" | "inline";
  /**
   * `2` flows the rows into two columns, left to right, once the list's own container is wide
   * enough (`@xl`, 36rem) — a wide record pane reads as two columns of facts, and the same list in
   * a narrow rail stays one column. Works with both variants; `inline` keeps its fixed label
   * column inside each column.
   * @default 1
   */
  columns?: 1 | 2;
}

/**
 * `PropertyList` — the container. Rows stack with tight rhythm; the label
 * column is a shared fixed track so values align down the pane.
 *
 * @example
 * <PropertyList aria-label="Record details">
 *   <PropertyRow>
 *     <PropertyLabel icon={<Globe />}>Domains</PropertyLabel>
 *     <PropertyValue><a className="text-info-text" href="…">attio.com</a></PropertyValue>
 *   </PropertyRow>
 *   <PropertyRow>
 *     <PropertyLabel icon={<UsersRound />}>Team</PropertyLabel>
 *     <PropertyValue><span className="text-sm text-muted-foreground">Set a value…</span></PropertyValue>
 *   </PropertyRow>
 * </PropertyList>
 */
export function PropertyList({
  className,
  variant = "stacked",
  columns = 1,
  ...props
}: PropertyListProps) {
  return (
    <dl
      data-slot="property-list"
      data-variant={variant}
      data-columns={columns}
      className={cn(
        "group/property-list",
        // Named container: rows stack or sit side by side according to the PANE's
        // width, not the viewport's — the same facts pane is a narrow sidebar on a
        // wide screen as often as it is a wide column on a narrow one.
        "@container/property-list m-0 flex min-w-0 flex-col gap-1",
        // Two columns: a two-track grid whose rows span both tracks until the container reaches
        // @xl (a container cannot query itself, so the ROWS read the width — see PropertyRow).
        columns === 2 && "grid grid-cols-2 gap-x-8",
        className,
      )}
      {...props}
    />
  );
}

/** Native container props for one property row. */
export type PropertyRowProps = React.ComponentPropsWithRef<"div">;

/** `PropertyRow` — one label→value row. @example <PropertyRow><PropertyLabel>Name</PropertyLabel><PropertyValue>VegaStack</PropertyValue></PropertyRow> */
export function PropertyRow({ className, ...props }: PropertyRowProps) {
  return (
    <div
      data-slot="property-row"
      className={cn(
        // Below @xs the pane is too narrow for two tracks: the row stacks, so the
        // value gets the full width instead of being squeezed into a sliver.
        "grid min-h-7 grid-cols-1 items-start gap-x-2 gap-y-0.5",
        // At @xs and up the label track SHRINKS TO ITS CONTENT above a 20-unit
        // (80px) floor, instead of the old fixed 112px: short labels stop wasting
        // the value column's width, and long ones are no longer clipped by a
        // track that never negotiated with them.
        "@xs/property-list:min-h-7 @xs/property-list:grid-cols-[minmax(calc(var(--spacing)*20),max-content)_minmax(0,1fr)] @xs/property-list:gap-y-2",
        // Inline: one line at every width — a fixed 112px label column, so every value starts at
        // the same x, and the value takes the rest.
        "group-data-[variant=inline]/property-list:grid-cols-[--spacing(28)_minmax(0,1fr)] group-data-[variant=inline]/property-list:gap-x-3",
        // `columns={2}`: a row spans both tracks of the list's grid below @xl, one track above.
        "group-data-[columns=2]/property-list:col-span-2 @xl/property-list:group-data-[columns=2]/property-list:col-span-1",
        // Top-aligned, never centred: the label sits on the value's FIRST line, so a value that wraps
        // (or a multi-line note) keeps its label beside its opening line (see `PropertyLabel`).
        className,
      )}
      {...props}
    />
  );
}

/** Props for the term/label cell in a property row. */
export interface PropertyLabelProps extends React.ComponentPropsWithRef<"dt"> {
  /** Leading inline-role icon (decorative — the text carries the meaning). @default undefined */
  icon?: React.ReactNode;
}

/** `PropertyLabel` — the muted label cell. @example <PropertyLabel>Name</PropertyLabel> */
export function PropertyLabel({
  className,
  icon,
  children,
  ...props
}: PropertyLabelProps) {
  return (
    <dt
      data-slot="property-label"
      className={cn(
        // `leading-5` is the value's line height (`text-sm`), so the label's line box IS the value's
        // first line box and the two share a centre whatever the value's length.
        "flex min-w-0 items-center gap-1.5 text-xs leading-5 font-medium text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
      ) : null}
      <span
        className="min-w-0 truncate"
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </span>
    </dt>
  );
}

/** Native description/value props for a property row. */
export type PropertyValueProps = React.ComponentPropsWithRef<"dd">;

/** `PropertyValue` — the value cell. @example <PropertyValue>VegaStack</PropertyValue> */
export function PropertyValue({ className, ...props }: PropertyValueProps) {
  return (
    <dd
      data-slot="property-value"
      className={cn(
        // Wraps rather than truncates (D18's rule applied outside the table): a
        // value is the point of the row, and `truncate` also meant `overflow:
        // hidden`, which CLIPPED the focus ring of any link inside it (SP-03).
        // Compose `TruncatedText` explicitly where a single line is genuinely
        // required.
        "m-0 min-w-0 text-sm wrap-anywhere text-foreground",
        // A 28px quiet control (picker button, select trigger) hangs 4px above and below the 20px
        // first line, so its text shares the label's centre like a plain value does.
        "[&>[data-slot=button]]:-my-1 [&>[data-slot=select-trigger]]:-my-1",
        // A ghost RecordChip is a value that reads as plain text: its 24px box hangs 2px above and
        // below the line, and its 6px padding hangs past the column's start, so its text (or its
        // status icon or avatar) starts where plain values do and its tint sits in the gutter. A row
        // holding a chip is exactly as tall as a row holding text, whatever the pane's width.
        "[&>[data-slot=record-chip][data-variant=ghost]]:-my-0.5 [&>[data-slot=record-chip][data-variant=ghost]]:-ms-1.5",
        // An inline EditableCell gets the same compact box as a ghost chip, in every state: 6px and
        // 2px of padding hung outside the value by equal negative margins, so its text starts, sits
        // and wraps exactly where a read-only value's does, and the hover/focus tint extends just
        // past the text. The field laid over it while editing carries the same padding, so the
        // caret starts on the text and nothing moves entering or leaving edit.
        "[&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-display]]:-mx-1.5 [&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-display]]:-my-0.5 [&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-display]]:max-w-[calc(100%+0.75rem)] [&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-display]]:rounded-md [&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-display]]:px-1.5 [&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-display]]:py-0.5",
        "[&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-input]]:rounded-md [&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-input]]:px-1.5 [&>[data-slot=editable-cell][data-variant=inline]_[data-slot=editable-cell-input]]:py-0.5",
        // An EditableCell `select` editor: its 28px trigger hangs 4px above and below the line and
        // its start padding plus border past the column, so the chosen option's text starts where
        // plain values do.
        "[&>[data-slot=editable-cell]_[data-slot=select-trigger]]:-my-1 [&>[data-slot=editable-cell]_[data-slot=select-trigger]]:-ms-[calc(var(--spacing)*2.5+1px)]",
        // Inline: a quiet picker's ghost padding hangs past the column's start so its text lines
        // up with plain values.
        "group-data-[variant=inline]/property-list:flex group-data-[variant=inline]/property-list:min-w-0 group-data-[variant=inline]/property-list:[&>[data-slot=button]]:-ms-2",
        className,
      )}
      {...props}
    />
  );
}

/** Props for `PropertyEmpty`. */
export interface PropertyEmptyProps extends React.ComponentPropsWithRef<"span"> {
  /**
   * What an unset value shows. Pass a quiet "+ Add" picker trigger instead when the value is
   * editable.
   * @default "—"
   */
  children?: React.ReactNode;
}

/** `PropertyEmpty` — an unset value: a muted "—". @example <PropertyValue><PropertyEmpty /></PropertyValue> */
export function PropertyEmpty({
  className,
  children = "—",
  ...props
}: PropertyEmptyProps) {
  return (
    <span
      data-slot="property-empty"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </span>
  );
}

/** Props for `PropertySection`. */
export interface PropertySectionProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title"
> {
  /** The section's small muted title, e.g. "Participants" or "Linked to". */
  title: React.ReactNode;
}

/**
 * `PropertySection` — a group under a small muted title, its content (chips, a list of people)
 * stacked below. Use it after a `PropertyList` for values too big for one row.
 *
 * @example
 * <PropertySection title="Linked to"><RecordChip … /><RecordChip … /></PropertySection>
 */
export function PropertySection({
  className,
  title,
  children,
  ...props
}: PropertySectionProps) {
  const id = React.useId();
  return (
    <section
      data-slot="property-section"
      aria-labelledby={id}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    >
      <h3
        id={id}
        data-slot="property-section-title"
        className="text-xs font-medium text-muted-foreground"
      >
        {title}
      </h3>
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        {children}
      </div>
    </section>
  );
}
