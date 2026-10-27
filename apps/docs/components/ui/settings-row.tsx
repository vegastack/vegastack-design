// @vegastack settings-row@0.25.94 sha256-ezo5PsUQFCkEZPkm70dXGIz0ozHow/c/+3CvR3id1Ik=

import * as React from "react";
import { cn } from "@vegastack/design";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

/**
 * Heading levels `SettingsSection` will render its `title` as. A settings page nests
 * sections at different depths, and a heading level is a DOCUMENT-STRUCTURE fact the page
 * owns, not something the component can infer — a screen-reader user navigating by heading
 * gets a broken outline when every section hard-codes `<h3>`.
 */
export type SettingsSectionTitleTag = "h2" | "h3" | "h4" | "h5" | "h6";

/** Props accepted by `SettingsSection`. */
export interface SettingsSectionProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  /**
   * Section heading rendered above the grouped content.

   * @default undefined
   */
  title?: React.ReactNode;
  /**
   * Heading element the `title` renders as. Pick the level that continues the page's
   * outline — `h2` directly under the page `h1`, `h3` inside an `h2` group, and so on.
   * The visual size never changes (it is the `text-base font-medium` role either way); only the
   * document structure does.
   *
   * `as` rather than Base UI `render` on purpose: `useRender` calls `React.useRef`
   * internally, which would force `'use client'` onto this file and cost the whole
   * settings family its server-safe status for a prop that only picks a tag name.
   *
   * @default 'h3'
   */
  titleAs?: SettingsSectionTitleTag;
  /**
   * Supporting description rendered under the title (muted).

   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * Section-level actions ("Sign out other devices", "New attribute") on the SAME row as the
   * title, right-aligned. They wrap under the title only when the row runs out of room.
   * @default undefined
   */
  actions?: React.ReactNode;
}

/**
 * `SettingsSection` — a titled group of settings. Renders an optional `title`,
 * `description` and right-aligned `actions` above its `children` (typically a `SettingsCard`).
 * The actions stay on the title row beside a long description (top-aligned to the title), and
 * wrap under it only when the header is too narrow for both.
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsSection titleAs="h2" title="Notifications" description="Choose what you hear about.">
 *   <SettingsCard>
 *     <SettingsRow label="Email" description="Product updates and tips.">
 *       <Switch defaultChecked />
 *     </SettingsRow>
 *   </SettingsCard>
 * </SettingsSection>
 */
export function SettingsSection({
  className,
  title,
  titleAs: TitleTag = "h3",
  description,
  actions,
  children,
  ref,
  ...props
}: SettingsSectionProps) {
  return (
    <section
      ref={ref}
      data-slot="settings-section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {(title != null || description != null || actions != null) && (
        <div
          data-slot="settings-section-header"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 has-data-[slot=settings-section-description]:items-start"
        >
          <div className="flex min-w-0 flex-col gap-1 has-data-[slot=settings-section-description]:flex-[1_1_16rem]">
            {title != null && (
              <TitleTag
                data-slot="settings-section-title"
                className="font-heading text-base font-medium text-foreground"
              >
                {title}
              </TitleTag>
            )}
            {description != null && (
              <p
                data-slot="settings-section-description"
                className="text-xs leading-normal text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
          {actions != null && (
            <div
              data-slot="settings-section-actions"
              className="ms-auto flex shrink-0 items-center gap-2"
            >
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/** Props accepted by `SettingsCard`. */
export type SettingsCardProps = React.ComponentProps<typeof Card>;

/**
 * `SettingsCard` — the container that groups `SettingsRow`s into one surface.
 *
 * **It IS upstream's `Card`**, not a second card recipe: the radius, the `bg-card` ground and the
 * 1px `border border-border` hairline (BRD-1) all come from `card.tsx`, so a settings card and every
 * other card on the page are the same object. This file only removes the two things a
 * flush divided list cannot use — the card's own vertical padding and its inter-section gap
 * (`py-0 gap-0`) — so each `SettingsRow` sits edge to edge and its own `border-b` is the only
 * divider. The last row's border is collapsed, so the list ends on the card edge rather than on a
 * stray rule.
 *
 * Pure presentational and server-safe — no hooks, no `'use client'` (`Card` has none either).
 *
 * @example
 * <SettingsCard>
 *   <SettingsRow label="Email notifications"><Switch /></SettingsRow>
 * </SettingsCard>
 */
export function SettingsCard({ className, ref, ...props }: SettingsCardProps) {
  return (
    <Card
      ref={ref}
      data-slot="settings-card"
      className={cn(
        "gap-0 py-0",
        // Collapse the trailing row divider so only inter-row borders show.
        "[&>[data-slot=settings-row]:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/** A sized control slot: its first child (the control) fills it; a trailing icon keeps its size. */
const CONTROL_FILL = "w-full [&>:first-child]:min-w-0 [&>:first-child]:flex-1";

/**
 * No `controlSize`: `md` when the slot holds one of the system's field controls, found by its
 * `data-slot` — written out literally, because Tailwind only generates the classes it can read.
 */
const FIELD_CONTROL_DEFAULT =
  "has-[[data-slot=input],[data-slot=input-group],[data-slot=textarea],[data-slot=select-trigger],[data-slot=combobox-chips],[data-slot=native-select-wrapper],[data-slot=date-picker-trigger],[data-slot=date-range-picker-trigger],[data-slot=people-picker],[data-slot=searchable-select],[data-slot=country-select],[data-slot=region-select],[data-slot=number-field],[data-slot=chip-input-root]]:w-full @sm/settings-row:has-[[data-slot=input],[data-slot=input-group],[data-slot=textarea],[data-slot=select-trigger],[data-slot=combobox-chips],[data-slot=native-select-wrapper],[data-slot=date-picker-trigger],[data-slot=date-range-picker-trigger],[data-slot=people-picker],[data-slot=searchable-select],[data-slot=country-select],[data-slot=region-select],[data-slot=number-field],[data-slot=chip-input-root]]:w-64 has-[[data-slot=input],[data-slot=input-group],[data-slot=textarea],[data-slot=select-trigger],[data-slot=combobox-chips],[data-slot=native-select-wrapper],[data-slot=date-picker-trigger],[data-slot=date-range-picker-trigger],[data-slot=people-picker],[data-slot=searchable-select],[data-slot=country-select],[data-slot=region-select],[data-slot=number-field],[data-slot=chip-input-root]]:[&>:first-child]:min-w-0 has-[[data-slot=input],[data-slot=input-group],[data-slot=textarea],[data-slot=select-trigger],[data-slot=combobox-chips],[data-slot=native-select-wrapper],[data-slot=date-picker-trigger],[data-slot=date-range-picker-trigger],[data-slot=people-picker],[data-slot=searchable-select],[data-slot=country-select],[data-slot=region-select],[data-slot=number-field],[data-slot=chip-input-root]]:[&>:first-child]:flex-1";

/** Props accepted by `SettingsRow`. */
export interface SettingsRowProps extends React.ComponentProps<"div"> {
  /**
   * The row label rendered on the left (heading line of the row).
   */
  label: React.ReactNode;
  /**
   * Optional supporting description rendered under the label (muted).

   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * The control rendered on the right — a `Switch`, `Input`, `Button`, badge,
   * or read-only value.

   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * ID of the form control rendered in `children`. When provided, the visual
   * row label renders as a real `<label htmlFor={controlId}>`.

   * @default undefined
   */
  controlId?: string;
  /**
   * Props merged onto the generated label element when `controlId` is provided.

   * @default undefined
   */
  labelProps?: React.ComponentProps<"label">;
  /**
   * The control's width once the row sits side by side, so every row's control shares one
   * width and one right edge: `sm` 160px, `md` 256px, `lg` 320px — the first child of the control
   * slot fills it (a trailing status icon or button keeps its own size). `auto` keeps the
   * control's own width (a switch, a button, a read-only value). Below the row's side-by-side
   * width the control spans the row whatever the size. Never set a width class on the control
   * itself — pick a size.
   * @default "md" for a field control (input, input group, textarea, select, combobox, searchable, country or region select, date or people picker, number field), otherwise "auto"
   */
  controlSize?: "sm" | "md" | "lg" | "auto";
}

/**
 * `SettingsRow` — one setting: a `label` (plus optional `description`) on the
 * left and a control slot (`children`) on the right. Carries a bottom border so
 * stacked rows inside a `SettingsCard` read as a divided list.
 *
 * The row is its OWN named `@container` (`@container/settings-row`) — its
 * label/control layout stacks or goes horizontal based on the row's own measured
 * width, not the viewport. That means a row placed in a narrow card on a wide
 * screen still stacks (e.g. a settings panel in a split view or a dialog), while
 * the same row in a full-width page goes horizontal — something a `sm:` viewport
 * breakpoint can't express. Works standalone (no `SettingsCard` required): the
 * outer element establishes the container, the inner layout row queries it.
 *
 * The control slot has one measure per `controlSize` (160/256/320px), so stacked rows line their
 * controls up on one right edge AND one left edge. Left unset, a row holding a field control
 * (input, input group, textarea, select, combobox, date or people picker) takes `md`, detected
 * in CSS from the control's `data-slot`, and any other control keeps its own width.
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsRow label="Workspace name" description="Shown across the product.">
 *   <Input defaultValue="Acme" />
 * </SettingsRow>
 * <SettingsRow label="Language" controlSize="lg"><LanguagePicker /></SettingsRow>
 */
export function SettingsRow({
  className,
  label,
  description,
  children,
  controlId,
  labelProps,
  controlSize,
  ref,
  ...props
}: SettingsRowProps) {
  const LabelTag = controlId ? "label" : "span";
  return (
    <div
      ref={ref}
      data-slot="settings-row"
      className={cn(
        "@container/settings-row border-b border-border px-4 py-3",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 @sm/settings-row:flex-row @sm/settings-row:items-center @sm/settings-row:justify-between @sm/settings-row:gap-4">
        <div
          data-slot="settings-row-label"
          className="flex min-w-0 flex-1 flex-col gap-0.5"
        >
          <LabelTag
            {...(controlId ? { htmlFor: controlId } : {})}
            {...(controlId ? labelProps : undefined)}
            className={cn(
              "text-sm font-medium text-foreground",
              labelProps?.className,
            )}
          >
            {label}
          </LabelTag>
          {description != null && (
            <span
              data-slot="settings-row-description"
              className="text-xs leading-normal text-muted-foreground"
            >
              {description}
            </span>
          )}
        </div>
        {children != null && (
          <div
            data-slot="settings-row-control"
            data-control-size={controlSize}
            className={cn(
              "flex shrink-0 items-center gap-2 @sm/settings-row:justify-end",
              controlSize === undefined
                ? FIELD_CONTROL_DEFAULT
                : controlSize !== "auto" && [
                    CONTROL_FILL,
                    controlSize === "sm" && "@sm/settings-row:w-40",
                    controlSize === "md" && "@sm/settings-row:w-64",
                    controlSize === "lg" && "@sm/settings-row:w-80",
                  ],
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/** One row of a `SettingsMatrix`: a setting and its on/off value per column. */
export interface SettingsMatrixRow {
  /** A stable key for the row. @default the row's index */
  id?: string;
  /** The setting's name, on the left; with a column's name it names each switch ("Mentions Email"). */
  label: React.ReactNode;
  /** A muted line under the label. @default undefined */
  description?: React.ReactNode;
  /** On or off, one per column, in the columns' order. */
  values: readonly boolean[];
  /** Called when a switch in this row changes, with its column's index. @default undefined */
  onChange?: (column: number, checked: boolean) => void;
  /**
   * Switches that cannot change — `true` for the whole row, or one flag per column.
   * @default false
   */
  disabled?: boolean | readonly boolean[];
}

/** Props accepted by `SettingsMatrix`. */
export interface SettingsMatrixProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The column names ("Push", "Email"), shown once above the switches. */
  columns: readonly React.ReactNode[];
  /** The settings, one row each. */
  rows: readonly SettingsMatrixRow[];
  /**
   * The header above the row labels ("What you hear about"). Omit for an empty corner.
   * @default undefined
   */
  label?: React.ReactNode;
}

/**
 * `SettingsMatrix` — settings × channels as one bordered surface: the column names ("Push",
 * "Email") once, in a header that sticks to the top of the scrolling page, a switch per row
 * under each, and the row labels on the left — instead of repeating "Push" and "Email" beside
 * every switch. It sits where a `SettingsCard` would, inside a `SettingsSection`.
 *
 * It follows its own width (`@container/settings-matrix`): below 28rem the header goes and each
 * row stacks its switches under its label, each switch with its column name beside it. Every
 * switch is named by its row and its column ("Mentions Email") in both layouts.
 *
 * Server-safe — no state of its own (`useId` only); the values and `onChange` are the host's.
 *
 * @example
 * <SettingsMatrix
 *   label="What you hear about"
 *   columns={["Push", "Email"]}
 *   rows={[
 *     { label: "Assigned to me", values: [true, true], onChange: (c, on) => set("assigned", c, on) },
 *     { label: "Mentions", values: [true, false], onChange: (c, on) => set("mentions", c, on) },
 *   ]}
 * />
 */
export function SettingsMatrix({
  columns,
  rows,
  label,
  className,
  style,
  ref,
  ...props
}: SettingsMatrixProps) {
  const id = React.useId();
  return (
    <div
      ref={ref}
      data-slot="settings-matrix"
      className={cn(
        "@container/settings-matrix rounded-xl border border-border bg-card text-sm text-card-foreground",
        className,
      )}
      style={
        {
          "--settings-matrix-columns": columns.length,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        data-slot="settings-matrix-header"
        aria-hidden
        className="sticky top-0 z-10 hidden grid-cols-[minmax(0,1fr)_repeat(var(--settings-matrix-columns),calc(var(--spacing)*16))] items-center gap-x-4 rounded-t-xl border-b border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground @md/settings-matrix:grid"
      >
        <span className="min-w-0 truncate">{label}</span>
        {columns.map((column, index) => (
          <span key={index} className="truncate text-center">
            {column}
          </span>
        ))}
      </div>
      {rows.map((row, rowIndex) => {
        const rowId = `${id}-${rowIndex}`;
        return (
          <div
            key={row.id ?? rowIndex}
            data-slot="settings-matrix-row"
            className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 @md/settings-matrix:grid @md/settings-matrix:grid-cols-[minmax(0,1fr)_repeat(var(--settings-matrix-columns),calc(var(--spacing)*16))] @md/settings-matrix:items-center @md/settings-matrix:gap-x-4"
          >
            <div
              data-slot="settings-matrix-label"
              className="flex min-w-0 flex-col gap-0.5"
            >
              <span
                id={`${rowId}-label`}
                className="text-sm font-medium text-foreground"
              >
                {row.label}
              </span>
              {row.description != null ? (
                <span className="text-xs leading-normal text-muted-foreground">
                  {row.description}
                </span>
              ) : null}
            </div>
            <div
              data-slot="settings-matrix-cells"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 @md/settings-matrix:contents"
            >
              {columns.map((column, columnIndex) => {
                const cellId = `${rowId}-${columnIndex}`;
                const disabled = Array.isArray(row.disabled)
                  ? row.disabled[columnIndex] === true
                  : row.disabled === true;
                return (
                  <label
                    key={columnIndex}
                    data-slot="settings-matrix-cell"
                    className="flex items-center gap-2 @md/settings-matrix:justify-center"
                  >
                    <Switch
                      aria-labelledby={`${rowId}-label ${cellId}`}
                      checked={row.values[columnIndex] === true}
                      disabled={disabled}
                      // No handler, no change: say so rather than offer a switch that never moves.
                      readOnly={!row.onChange}
                      // Only a host with a handler gets one: a read-only matrix stays renderable
                      // from a Server Component, which cannot hand a closure to a client leaf.
                      onCheckedChange={
                        row.onChange
                          ? (checked) => row.onChange?.(columnIndex, checked)
                          : undefined
                      }
                    />
                    <span
                      id={cellId}
                      data-slot="settings-matrix-cell-label"
                      className="text-sm @md/settings-matrix:sr-only"
                    >
                      {column}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
