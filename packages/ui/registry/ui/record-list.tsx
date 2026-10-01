// @vegastack record-list@0.23.99 sha256-v+69/z9ke4iVj0ci83jk+jDhZy12hIach0IRKiH52sk=

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---
`RecordList` is the "these records are affected" list a confirmation dialog shows before a
change lands: the products a family save gives new issues, the products an accessory delete
leaves. It is an ordered list, so every row is numbered — 1., 2., … — and the numbers
continue when the host appends the next batch behind `RecordListMore`'s "Show more", because
the rows stay one `<ol>`.

A row is a leading muted record-type icon, the record's name, an optional badge and an
optional one-line description. With `href`, a small ↗ link sits right after the name on the
title line — "Open {name} in a new tab" — shown on row hover or focus within the row and
always on a coarse pointer. It always opens a new tab (`target="_blank"`, `rel="noopener"`)
because the list lives in a dialog the reader has not answered yet.

Two companions for the "why is this refused" message: `RecordListGroup` puts a short heading
over one list when a refusal names several groups of clashing records ("Group 1 · 3 products"),
and `RecordDiff` is the compact "what differs" table — spec | this record | the other one — that
marks the rows whose values differ, so the reader sees at a glance why two records count as the
same.

Deliberately NOT done here:
- No selection and no row click. The rows are context for a decision, not controls; the one
  action per row is the new-tab link.
- No paging state. The host owns the rows and the count; `RecordListMore` is a controlled
  footer.
--- */

/** Props accepted by `RecordList`. */
export interface RecordListProps extends React.ComponentPropsWithRef<"ol"> {
  /**
   * Accessible name of the list ("Affected products").
   * @default undefined
   */
  "aria-label"?: string;
}

/**
 * `RecordList` — a numbered list of records for a confirmation dialog. Compose
 * `RecordListItem` rows inside it and `RecordListMore` after it.
 *
 * @example
 * <RecordList aria-label="Affected products">
 *   {rows.map((row) => (
 *     <RecordListItem key={row.id} icon={<Package />} title={row.name} href={`/products/${row.id}`} />
 *   ))}
 * </RecordList>
 * <RecordListMore remaining={total - rows.length} onShowMore={loadMore} />
 */
export function RecordList({ className, ...props }: RecordListProps) {
  return (
    <ol
      data-slot="record-list"
      className={cn(
        "flex list-outside list-decimal flex-col gap-1 ps-6 text-sm marker:text-xs marker:text-muted-foreground marker:tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `RecordListItem`. */
export interface RecordListItemProps extends Omit<
  React.ComponentPropsWithRef<"li">,
  "title"
> {
  /**
   * The record type's icon, drawn muted before the name.
   * @default undefined
   */
  icon?: React.ReactNode;
  /** The record's name. */
  title: React.ReactNode;
  /**
   * One line under the name — what happens to this record.
   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * A status after the name and its link — a `Badge`.
   * @default undefined
   */
  badge?: React.ReactNode;
  /**
   * The record's page. Adds a ↗ link after the name that opens it in a new tab.
   * @default undefined
   */
  href?: string;
  /**
   * Accessible name of the ↗ link.
   * @default `Open ${title} in a new tab` when `title` is a string, else "Open in a new tab"
   */
  openLabel?: string;
}

/**
 * `RecordListItem` — one numbered row: icon, name, the ↗ new-tab link, badge and
 * description.
 *
 * @example
 * <RecordListItem icon={<Package />} title="Orbit Track 30W" badge={<Badge>Draft</Badge>} href="/products/p1" />
 */
export function RecordListItem({
  icon,
  title,
  description,
  badge,
  href,
  openLabel,
  className,
  ...props
}: RecordListItemProps) {
  const label =
    openLabel ??
    (typeof title === "string"
      ? `Open ${title} in a new tab`
      : "Open in a new tab");
  return (
    <li
      data-slot="record-list-item"
      className={cn("group/record-list-item ps-1", className)}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2 py-1">
        {icon ? (
          <span
            aria-hidden="true"
            data-slot="record-list-icon"
            className="flex h-5 shrink-0 items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
          >
            {icon}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex min-w-0 items-center gap-1">
              <span
                data-slot="record-list-title"
                className="truncate font-medium text-foreground"
              >
                {title}
              </span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  aria-label={label}
                  data-slot="record-list-link"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-xs" }),
                    "-my-1 shrink-0 text-muted-foreground opacity-0 group-focus-within/record-list-item:opacity-100 group-hover/record-list-item:opacity-100 hover:text-foreground focus-visible:opacity-100 active:not-aria-[haspopup]:translate-y-0 pointer-coarse:opacity-100",
                  )}
                >
                  <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
            </span>
            {badge}
          </div>
          {description ? (
            <span
              data-slot="record-list-description"
              className="text-xs text-muted-foreground"
            >
              {description}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Props accepted by `RecordListMore`. */
export interface RecordListMoreProps extends React.ComponentPropsWithRef<"div"> {
  /** How many records are not shown yet. Nothing renders at zero. */
  remaining: number;
  /**
   * Load the next batch. Without it the footer only says how many more there are.
   * @default undefined
   */
  onShowMore?: () => void;
  /**
   * A batch is loading: the button shows its spinner.
   * @default false
   */
  loading?: boolean;
  /**
   * The button's label.
   * @default "Show more"
   */
  label?: string;
}

/**
 * `RecordListMore` — "and 14 more · Show more" after a `RecordList`. The host
 * appends the next rows to the same list, so their numbers continue.
 *
 * @example
 * <RecordListMore remaining={14} onShowMore={loadMore} loading={loading} />
 */
export function RecordListMore({
  remaining,
  onShowMore,
  loading = false,
  label = "Show more",
  className,
  ...props
}: RecordListMoreProps) {
  if (remaining <= 0) return null;
  return (
    <div
      data-slot="record-list-more"
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground tabular-nums",
        className,
      )}
      {...props}
    >
      <span>{`and ${remaining.toLocaleString("en")} more`}</span>
      {onShowMore ? (
        <Button
          size="sm"
          variant="ghost"
          loading={loading}
          onClick={onShowMore}
        >
          {label}
        </Button>
      ) : null}
    </div>
  );
}

/** Props accepted by `RecordListGroup`. */
export interface RecordListGroupProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "title"
> {
  /** The group's heading ("Group 1 · 3 products"), which also names it for assistive technology. */
  title: React.ReactNode;
}

/**
 * `RecordListGroup` — a short muted heading over one `RecordList`, for a message that names
 * several groups of records (the products that would clash with each other, group by group).
 *
 * @example
 * <RecordListGroup title="Group 1 · 3 products">
 *   <RecordList aria-label="Group 1">…</RecordList>
 * </RecordListGroup>
 */
export function RecordListGroup({
  title,
  className,
  children,
  ...props
}: RecordListGroupProps) {
  const titleId = React.useId();
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-slot="record-list-group"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <p
        id={titleId}
        data-slot="record-list-group-title"
        className="text-xs text-muted-foreground"
      >
        {title}
      </p>
      {children}
    </div>
  );
}

/** One row of a `RecordDiff`: a spec and the value each record holds. */
export interface RecordDiffRow {
  /** Stable key; defaults to the label when it is a string. */
  key?: string;
  /** The spec's name ("Beam angle"). */
  label: React.ReactNode;
  /** One value per column, in column order. An empty value reads "—". */
  values: readonly React.ReactNode[];
  /**
   * Whether the values differ. By default, rows whose values are all strings or numbers are
   * compared as text; pass it for anything else.
   * @default the values compared as text
   */
  differs?: boolean;
}

/** Props accepted by `RecordDiff`. */
export interface RecordDiffProps extends React.ComponentPropsWithRef<"table"> {
  /** The record columns' headings ("This product", "Existing product"). */
  columns: readonly React.ReactNode[];
  /** The specs to compare, one row each. */
  rows: readonly RecordDiffRow[];
  /**
   * The first column's heading.
   * @default "Spec"
   */
  labelHeading?: React.ReactNode;
  /**
   * Read after a differing row's label by screen readers.
   * @default "differs"
   */
  differsLabel?: string;
}

function valuesDiffer(values: readonly React.ReactNode[]): boolean {
  const text = values.map((value) =>
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : value == null || value === ""
        ? ""
        : null,
  );
  if (text.some((value) => value === null)) return false;
  return new Set(text).size > 1;
}

/**
 * `RecordDiff` — the compact "what differs" table beside a conflict: spec | this record | the
 * other record. Rows whose values differ are marked (a tinted row, the values in full ink, and
 * "differs" for screen readers); rows that match stay muted, so the reason two records count as
 * the same reads at a glance.
 *
 * @example
 * <RecordDiff
 *   columns={["This product", "Existing product"]}
 *   rows={[
 *     { label: "Colour temperature", values: ["3000K", "3000K"] },
 *     { label: "Lens", values: ["Clear", "Frosted"] },
 *   ]}
 * />
 */
export function RecordDiff({
  columns,
  rows,
  labelHeading = "Spec",
  differsLabel = "differs",
  className,
  ...props
}: RecordDiffProps) {
  return (
    <Table
      data-slot="record-diff"
      className={cn("text-xs", className)}
      {...props}
    >
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 text-xs text-muted-foreground">
            {labelHeading}
          </TableHead>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              className="h-8 text-xs text-muted-foreground"
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => {
          const differs = row.differs ?? valuesDiffer(row.values);
          return (
            <TableRow
              key={
                row.key ??
                (typeof row.label === "string" ? row.label : String(index))
              }
              data-slot="record-diff-row"
              data-differs={differs ? "" : undefined}
              className="text-muted-foreground hover:bg-transparent data-differs:bg-muted data-differs:text-foreground data-differs:hover:bg-muted"
            >
              <TableCell className="py-1.5">
                {row.label}
                {differs ? (
                  <span className="sr-only">{`, ${differsLabel}`}</span>
                ) : null}
              </TableCell>
              {columns.map((_, column) => {
                const value = row.values[column];
                return (
                  <TableCell
                    key={column}
                    className="py-1.5 in-data-differs:font-medium"
                  >
                    {value == null || value === "" ? "—" : value}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
