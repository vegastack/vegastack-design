// @vegastack table@0.2.0 sha256-7yEcpkLfAKgHzqsMzavGelyv9xbdDhICKd8RdqifVp4=

import * as React from 'react';
import { cn } from '@vegastack/design';

/** Props for `Table` — a native `<table>` rendered inside an overflow container. */
export type TableProps = React.ComponentProps<'table'>;

/**
 * `Table` — a styled semantic `<table>` wrapped in a horizontally scrollable
 * container so wide tables never overflow their parent. Compose with
 * `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`,
 * `TableCell`, and `TableCaption`.
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead>Role</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>Ada</TableCell>
 *       <TableCell>Engineer</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 */
function Table({ className, ref, ...props }: TableProps) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        ref={ref}
        data-slot="table"
        className={cn('w-full caption-bottom text-base', className)}
        {...props}
      />
    </div>
  );
}

/** Props for `TableHeader` — the `<thead>` group. */
export type TableHeaderProps = React.ComponentProps<'thead'>;

/**
 * `TableHeader` — the `<thead>` group holding the header row(s).
 * Adds a bottom border to each contained row.
 */
function TableHeader({ className, ref, ...props }: TableHeaderProps) {
    return (
      <thead
        ref={ref}
        data-slot="table-header"
        className={cn('[&_tr]:border-b [&_tr]:border-border', className)}
        {...props}
      />
    );
}

/** Props for `TableBody` — the `<tbody>` group. */
export type TableBodyProps = React.ComponentProps<'tbody'>;

/**
 * `TableBody` — the `<tbody>` group holding the data rows.
 * Drops the border on the final row for a clean bottom edge.
 */
function TableBody({ className, ref, ...props }: TableBodyProps) {
    return (
      <tbody
        ref={ref}
        data-slot="table-body"
        className={cn('[&_tr:last-child]:border-0', className)}
        {...props}
      />
    );
}

/** Props for `TableFooter` — the `<tfoot>` group. */
export type TableFooterProps = React.ComponentProps<'tfoot'>;

/**
 * `TableFooter` — the `<tfoot>` group for summary rows (totals, counts).
 * Sits on a subtle muted background with a top border.
 */
function TableFooter({ className, ref, ...props }: TableFooterProps) {
    return (
      <tfoot
        ref={ref}
        data-slot="table-footer"
        className={cn(
          'border-t border-border bg-muted/(--alpha-wash) font-medium [&>tr]:last:border-b-0',
          className,
        )}
        {...props}
      />
    );
}

/** Props for `TableRow` — a single `<tr>`. */
export type TableRowProps = React.ComponentProps<'tr'>;

/**
 * `TableRow` — a single `<tr>`. Lifts to the neutral `accent` fill on hover and
 * when selected (`data-selected` attribute), with a bottom border separating rows.
 */
function TableRow({ className, ref, ...props }: TableRowProps) {
  return (
    <tr
      ref={ref}
      data-slot="table-row"
      className={cn(
        'border-b border-border transition-colors duration-fast ease-standard hover:bg-accent data-selected:bg-accent',
        className,
      )}
      {...props}
    />
  );
}

/** Props for `TableHead` — a header cell `<th>`. */
export type TableHeadProps = React.ComponentProps<'th'>;

/**
 * `TableHead` — a header cell (`<th>`). A compact (32px, `--size-md`), left-aligned
 * `text-label-sm` (12/500) header in `muted-foreground`, rendered title-case as
 * authored (sortable + non-sortable match); collapses right padding for a checkbox.
 */
function TableHead({ className, scope = 'col', ref, ...props }: TableHeadProps) {
  return (
    <th
      ref={ref}
      scope={scope}
      data-slot="table-head"
      className={cn(
        'h-(--size-md) px-3 text-left align-middle text-label-sm whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

/** Props for `TableCell` — a data cell `<td>`. */
export type TableCellProps = React.ComponentProps<'td'>;

/**
 * `TableCell` — a data cell (`<td>`). Vertically centered with consistent
 * padding; collapses right padding when it hosts a checkbox.
 */
function TableCell({ className, ref, ...props }: TableCellProps) {
  return (
    <td
      ref={ref}
      data-slot="table-cell"
      className={cn(
        'px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

/** Props for `TableCaption` — the `<caption>` describing the table. */
export type TableCaptionProps = React.ComponentProps<'caption'>;

/**
 * `TableCaption` — the `<caption>` describing the table for sighted and
 * assistive-technology users. Rendered below the table (`caption-bottom`).
 */
function TableCaption({ className, ref, ...props }: TableCaptionProps) {
    return (
      <caption
        ref={ref}
        data-slot="table-caption"
        className={cn('mt-4 text-base text-muted-foreground', className)}
        {...props}
      />
    );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
