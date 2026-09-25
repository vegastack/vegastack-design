// @vegastack property-list@0.23.20 sha256-gGI71nMLOrOMFhJx77Q/52vNrL6QM5NT5RvJ+FnKLkQ=

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
   * as in Linear or Notion; its editable values are quiet (ghost) pickers.
   * @default "stacked"
   */
  variant?: "stacked" | "inline";
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
  ...props
}: PropertyListProps) {
  return (
    <dl
      data-slot="property-list"
      data-variant={variant}
      className={cn(
        "group/property-list",
        // Named container: rows stack or sit side by side according to the PANE's
        // width, not the viewport's — the same facts pane is a narrow sidebar on a
        // wide screen as often as it is a wide column on a narrow one.
        "@container/property-list m-0 flex min-w-0 flex-col gap-1",
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
        "@xs/property-list:min-h-7 @xs/property-list:grid-cols-[minmax(calc(var(--spacing)*20),max-content)_minmax(0,1fr)] @xs/property-list:items-center @xs/property-list:gap-y-2",
        // Inline: one line at every width — a fixed 112px label column, so every value starts at
        // the same x, and the value takes the rest.
        "group-data-[variant=inline]/property-list:grid-cols-[--spacing(28)_minmax(0,1fr)] group-data-[variant=inline]/property-list:items-center group-data-[variant=inline]/property-list:gap-x-3",
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
        "flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground",
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
