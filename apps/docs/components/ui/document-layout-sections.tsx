// @vegastack document-layout@0.26.3 sha256-lFE5crlYqAfDi4v9HHthS7BX9nBDBjVncPP86EIJaCY=

"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useOverflow } from "@/components/ui/use-overflow";

/* ------------------------------------------------------------------------------------------------
 * What a document holds besides its prose: sections at its foot ("Pages inside", "Comments on the
 * page") with their heading, count and quiet actions; the list of pages under it; and a live block
 * drawn into its text (a task list's card: a header, rows, a note, a footer link). Client parts
 * of `document-layout`.
 * ----------------------------------------------------------------------------------------------*/

const SectionContext = React.createContext<string | null>(null);

/** Props accepted by `DocumentLayoutSection`. */
export type DocumentLayoutSectionProps = React.ComponentPropsWithRef<"section">;

/**
 * `DocumentLayoutSection` — one section at the document's foot ("Pages inside"): a `section`
 * named by its `DocumentLayoutSectionTitle`, its parts 8px apart. Always give it a title.
 *
 * @example
 * <DocumentLayoutSection>
 *   <DocumentLayoutSectionHeader>
 *     <DocumentLayoutSectionTitle count={3}>Pages inside</DocumentLayoutSectionTitle>
 *   </DocumentLayoutSectionHeader>
 *   <DocumentLayoutPageList>{rows}</DocumentLayoutPageList>
 * </DocumentLayoutSection>
 */
export function DocumentLayoutSection({
  className,
  ...props
}: DocumentLayoutSectionProps) {
  const id = React.useId();
  return (
    <SectionContext value={id}>
      <section
        data-slot="document-layout-section"
        aria-labelledby={id}
        className={cn("flex min-w-0 flex-col gap-2", className)}
        {...props}
      />
    </SectionContext>
  );
}

/**
 * `DocumentLayoutSectionHeader` — the section's title row: the title at the start, an action
 * (`Button variant="ghost" size="sm"`) at the end.
 *
 * @example
 * <DocumentLayoutSectionHeader>
 *   <DocumentLayoutSectionTitle>Pages inside</DocumentLayoutSectionTitle>
 *   <Button variant="ghost" size="sm">Add page</Button>
 * </DocumentLayoutSectionHeader>
 */
export function DocumentLayoutSectionHeader({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="document-layout-section-header"
      className={cn(
        "flex min-w-0 items-center justify-between gap-2",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutSectionTitle`. */
export interface DocumentLayoutSectionTitleProps
  // No `id`: the title's id is its section's, which names the section.
  extends Omit<React.ComponentPropsWithRef<"h2">, "id"> {
  /**
   * How many the section holds, after the title in the muted ink ("Pages inside · 3").
   * @default undefined
   */
  count?: React.ReactNode;
}

/**
 * `DocumentLayoutSectionTitle` — the section's heading (`h2`, 14px medium), naming its section;
 * `count` follows it in the muted ink.
 *
 * @example
 * <DocumentLayoutSectionTitle count="50+">Pages inside</DocumentLayoutSectionTitle>
 */
export function DocumentLayoutSectionTitle({
  count,
  className,
  children,
  ...props
}: DocumentLayoutSectionTitleProps) {
  const id = React.useContext(SectionContext);
  return (
    <h2
      data-slot="document-layout-section-title"
      className={cn("text-sm font-medium", className)}
      {...props}
      id={id ?? undefined}
    >
      {children}
      {count == null ? null : (
        <span className="text-muted-foreground"> · {count}</span>
      )}
    </h2>
  );
}

/** Props accepted by `DocumentLayoutSectionButton`. */
export interface DocumentLayoutSectionButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
> {
  /**
   * `more` — a quiet ghost button at the start of the section ("Show more pages", "Load
   * earlier"); `add` — the bare line a section is while it holds nothing ("+ Add a page inside"),
   * muted until hovered, with no fill.
   * @default "more"
   */
  look?: "more" | "add";
}

/**
 * `DocumentLayoutSectionButton` — a section's quiet button: `more` loads the rest of it, `add` is
 * the one line an empty section shows to someone who can fill it.
 *
 * @example
 * <DocumentLayoutSectionButton loading={loading} onClick={more}>Show more pages</DocumentLayoutSectionButton>
 */
export function DocumentLayoutSectionButton({
  look = "more",
  className,
  ...props
}: DocumentLayoutSectionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      data-look={look}
      className={cn(
        "text-muted-foreground",
        look === "more"
          ? "self-start"
          : "h-8 justify-start px-0 hover:bg-transparent hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutSectionSkeleton` — a section while it loads: a title bar and one row's block.
 *
 * @example
 * <DocumentLayoutSectionSkeleton />
 */
export function DocumentLayoutSectionSkeleton({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      aria-hidden
      data-slot="document-layout-section-skeleton"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/**
 * `DocumentLayoutPageList` — the pages under a document (`ul`): rows ruled above, between and
 * below, each a `DocumentLayoutPageItem`.
 *
 * @example
 * <DocumentLayoutPageList>
 *   <DocumentLayoutPageItem>
 *     <DocumentLayoutPageLink title="Install notes" render={<a href="/p/2" />} />
 *   </DocumentLayoutPageItem>
 * </DocumentLayoutPageList>
 */
export function DocumentLayoutPageList({
  className,
  ...props
}: React.ComponentPropsWithRef<"ul">) {
  return (
    // `role="list"`: the reset's `list-style: none` makes Safari drop the list semantics.
    <ul
      role="list"
      data-slot="document-layout-page-list"
      className={cn(
        "flex flex-col divide-y divide-border border-y border-border",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutPageItem` — one page's row (`li`): its `DocumentLayoutPageLink`, then any row
 * actions (a ⋯ menu) at the end.
 *
 * @example
 * <DocumentLayoutPageItem>
 *   <DocumentLayoutPageLink title="Install notes" render={<a href="/p/2" />} />
 *   <RowActionsMenu label="Install notes" actions={actions} />
 * </DocumentLayoutPageItem>
 */
export function DocumentLayoutPageItem({
  className,
  ...props
}: React.ComponentPropsWithRef<"li">) {
  return (
    <li
      data-slot="document-layout-page-item"
      className={cn("flex min-w-0 items-center gap-1", className)}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutPageLink`. */
export interface DocumentLayoutPageLinkProps extends Omit<
  React.ComponentProps<typeof Item>,
  "title" | "size" | "variant" | "children"
> {
  /** The page's name: it takes the row before the excerpt does, cut short to one line. */
  title: React.ReactNode;
  /**
   * The page's own icon (an emoji); a page icon when it has none.
   * @default undefined
   */
  icon?: string | null;
  /**
   * One line of its text, after the name from 640px, under it below.
   * @default undefined
   */
  excerpt?: React.ReactNode;
  /**
   * What closes the row, small and muted (when it changed).
   * @default undefined
   */
  meta?: React.ReactNode;
}

/**
 * `DocumentLayoutPageLink` — a page's row target: its icon, name, excerpt and meta, the whole row
 * the link (`render` your router's link). 56px tall on a coarse pointer.
 *
 * @example
 * <DocumentLayoutPageLink
 *   icon="📐"
 *   title="Install notes"
 *   excerpt="Mounting heights for the downlights…"
 *   meta="2h ago"
 *   render={<a href="/p/2" />}
 * />
 */
export function DocumentLayoutPageLink({
  title,
  icon,
  excerpt,
  meta,
  className,
  render,
  ...props
}: DocumentLayoutPageLinkProps) {
  return (
    <Item
      size="sm"
      data-slot="document-layout-page-link"
      className={cn(
        "min-w-0 flex-1 rounded-none px-1 pointer-coarse:min-h-14",
        className,
      )}
      render={render}
      {...props}
    >
      <ItemMedia>
        {icon ? (
          <span aria-hidden className="text-xl leading-none">
            {icon}
          </span>
        ) : (
          <FileText aria-hidden className="size-5 text-muted-foreground" />
        )}
      </ItemMedia>
      <ItemContent className="min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
        {/* The name takes the row before the excerpt does, cut short to it (any length, one
            unbroken word too). */}
        <ItemTitle className="max-w-full min-w-0">
          <span className="min-w-0 truncate">{title}</span>
        </ItemTitle>
        {excerpt ? (
          <ItemDescription className="line-clamp-1 min-w-0 flex-1">
            {excerpt}
          </ItemDescription>
        ) : null}
      </ItemContent>
      {meta == null ? null : (
        <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
      )}
    </Item>
  );
}

/**
 * `DocumentLayoutBlock` — a live block drawn into the document's text (a task list): a card with
 * a `DocumentLayoutBlockHeader`, its body (`DocumentLayoutBlockRows`, a `DocumentLayoutBlockNote`
 * or a `DocumentLayoutBlockSkeleton`) and a `DocumentLayoutBlockFooter`. Not editable text.
 *
 * @example
 * <DocumentLayoutBlock>
 *   <DocumentLayoutBlockHeader>
 *     <DocumentLayoutBlockTitle>Open tasks · this page</DocumentLayoutBlockTitle>
 *   </DocumentLayoutBlockHeader>
 *   <DocumentLayoutBlockNote>No tasks match</DocumentLayoutBlockNote>
 * </DocumentLayoutBlock>
 */
export function DocumentLayoutBlock({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="document-layout-block"
      contentEditable={false}
      className={cn(
        "my-2 rounded-lg border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockHeader` — the block's title row, ruled below; a `Button variant="ghost"
 * size="sm"` at its end.
 *
 * @example
 * <DocumentLayoutBlockHeader>
 *   <DocumentLayoutBlockTitle>Tasks</DocumentLayoutBlockTitle>
 *   <Button variant="ghost" size="sm">Filter</Button>
 * </DocumentLayoutBlockHeader>
 */
export function DocumentLayoutBlockHeader({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="document-layout-block-header"
      className={cn(
        "flex min-h-11 items-center gap-2 border-b border-border px-3 py-1",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockTitle` — what the block shows, 14px medium, cut short to one line.
 *
 * @example
 * <DocumentLayoutBlockTitle>Open tasks · assigned to me</DocumentLayoutBlockTitle>
 */
export function DocumentLayoutBlockTitle({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="document-layout-block-title"
      className={cn(
        "min-w-0 flex-1 truncate text-sm leading-tight font-medium",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockNote` — the block's body when it has no rows to show: a muted line
 * ("No tasks match", "Couldn't load tasks." with a `DocumentLayoutBlockAction`).
 *
 * @example
 * <DocumentLayoutBlockNote>
 *   Couldn't load tasks.
 *   <DocumentLayoutBlockAction onClick={retry}>Try again</DocumentLayoutBlockAction>
 * </DocumentLayoutBlockNote>
 */
export function DocumentLayoutBlockNote({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="document-layout-block-note"
      className={cn(
        "flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockSkeleton` — the block's body while it loads: two row bars.
 *
 * @example
 * <DocumentLayoutBlockSkeleton />
 */
export function DocumentLayoutBlockSkeleton({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      aria-hidden
      data-slot="document-layout-block-skeleton"
      className={cn("flex flex-col gap-2 px-3 py-3", className)}
      {...props}
    >
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  );
}

/**
 * `DocumentLayoutBlockRows` — the block's rows, ruled between. A `div` with `role="list"`, so a
 * host editor's list styles never reach it.
 *
 * @example
 * <DocumentLayoutBlockRows aria-label="Tasks">{rows}</DocumentLayoutBlockRows>
 */
export function DocumentLayoutBlockRows({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      role="list"
      data-slot="document-layout-block-rows"
      className={cn("divide-y divide-border", className)}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockRow` — one row (`role="listitem"`), 44px at least: a leading control, its
 * `DocumentLayoutBlockRowMain` and `DocumentLayoutBlockRowMeta`. Below 640px the meta wraps under
 * the main line.
 *
 * @example
 * <DocumentLayoutBlockRow>
 *   <TaskStatusMenu status={status} />
 *   <DocumentLayoutBlockRowMain>
 *     <DocumentLayoutBlockRowRef>T-12</DocumentLayoutBlockRowRef>
 *     <InlineChip kind="task" label="Order fixtures" />
 *   </DocumentLayoutBlockRowMain>
 *   <DocumentLayoutBlockRowMeta>due Oct 24</DocumentLayoutBlockRowMeta>
 * </DocumentLayoutBlockRow>
 */
export function DocumentLayoutBlockRow({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      role="listitem"
      data-slot="document-layout-block-row"
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-x-2 gap-y-0.5 px-2 py-1.5 sm:flex-nowrap",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockRowMain` — the row's main line (a reference and a chip), taking its free
 * width.
 *
 * @example
 * <DocumentLayoutBlockRowMain><InlineChip kind="task" label="Order fixtures" /></DocumentLayoutBlockRowMain>
 */
export function DocumentLayoutBlockRowMain({
  className,
  ...props
}: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="document-layout-block-row-main"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 text-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockRowRef` — a row's reference ("T-12"): muted, tabular figures, never cut.
 *
 * @example
 * <DocumentLayoutBlockRowRef>T-12</DocumentLayoutBlockRowRef>
 */
export function DocumentLayoutBlockRowRef({
  className,
  ...props
}: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="document-layout-block-row-ref"
      className={cn("shrink-0 text-muted-foreground tabular-nums", className)}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockRowMeta` — a row's details (an avatar, a due date), 12px muted: after the
 * main line from 640px, on its own line under it (past a 32px leading control) below.
 *
 * @example
 * <DocumentLayoutBlockRowMeta><Avatar size="sm" /> due Oct 24</DocumentLayoutBlockRowMeta>
 */
export function DocumentLayoutBlockRowMeta({
  className,
  ...props
}: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="document-layout-block-row-meta"
      className={cn(
        "ms-8 flex basis-full items-center gap-2 text-xs text-muted-foreground sm:ms-0 sm:basis-auto",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutBlockTable`. */
export interface DocumentLayoutBlockTableProps extends React.ComponentPropsWithRef<"div"> {
  /** How many columns each row has, the name column first. */
  columns: number;
}

/**
 * `DocumentLayoutBlockTable` — a block's rows as a quiet read-only table (a live view of a table's
 * records): a `role="table"` with a `DocumentLayoutBlockTableHead` and a
 * `DocumentLayoutBlockTableBody`. The first of its `columns` is the rows' name column, twice as
 * wide as the others and at least 10rem; the others are at least 7rem, and the table scrolls
 * sideways when they don't fit. Not a `table` element, so a host editor's table styles never
 * reach it. Nothing in it is editable.
 *
 * @example
 * <DocumentLayoutBlockTable columns={2} aria-label="Sample requests">
 *   <DocumentLayoutBlockTableHead>
 *     <DocumentLayoutBlockTableRow>
 *       <DocumentLayoutBlockTableColumn primary>Name</DocumentLayoutBlockTableColumn>
 *       <DocumentLayoutBlockTableColumn>Status</DocumentLayoutBlockTableColumn>
 *     </DocumentLayoutBlockTableRow>
 *   </DocumentLayoutBlockTableHead>
 *   <DocumentLayoutBlockTableBody>
 *     <DocumentLayoutBlockTableRow>
 *       <DocumentLayoutBlockTableCell primary>Lux survey</DocumentLayoutBlockTableCell>
 *       <DocumentLayoutBlockTableCell>Open</DocumentLayoutBlockTableCell>
 *     </DocumentLayoutBlockTableRow>
 *   </DocumentLayoutBlockTableBody>
 * </DocumentLayoutBlockTable>
 */
export function DocumentLayoutBlockTable({
  columns,
  className,
  style,
  ref,
  children,
  ...props
}: DocumentLayoutBlockTableProps) {
  const rest = Math.max(0, Math.floor(columns) - 1);
  // A keyboard reaches what scrolls: a tab stop only while its columns don't fit.
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const scrollable = useOverflow(node, { axis: "inline" });
  const setRefs = React.useMemo(() => mergeRefs(setNode, ref), [ref]);
  return (
    <div
      {...props}
      ref={setRefs}
      role="table"
      data-slot="document-layout-block-table"
      data-scrollable={scrollable ? "" : undefined}
      tabIndex={scrollable ? 0 : undefined}
      aria-colcount={rest + 1}
      className={cn("grid w-full overflow-x-auto text-sm", className)}
      style={{
        gridTemplateColumns: [
          "minmax(10rem, 2fr)",
          ...Array.from({ length: rest }, () => "minmax(7rem, 1fr)"),
        ].join(" "),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * `DocumentLayoutBlockTableHead` — the table's header row group: 12px muted column names, ruled
 * below.
 *
 * @example
 * <DocumentLayoutBlockTableHead>
 *   <DocumentLayoutBlockTableRow>
 *     <DocumentLayoutBlockTableColumn primary>Name</DocumentLayoutBlockTableColumn>
 *   </DocumentLayoutBlockTableRow>
 * </DocumentLayoutBlockTableHead>
 */
export function DocumentLayoutBlockTableHead({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      role="rowgroup"
      data-slot="document-layout-block-table-head"
      className={cn(
        "col-span-full grid grid-cols-subgrid border-b border-border text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockTableBody` — the table's rows, ruled between.
 *
 * @example
 * <DocumentLayoutBlockTableBody>{rows}</DocumentLayoutBlockTableBody>
 */
export function DocumentLayoutBlockTableBody({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      role="rowgroup"
      data-slot="document-layout-block-table-body"
      className={cn(
        "col-span-full grid grid-cols-subgrid divide-y divide-border",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockTableRow` — one row (`role="row"`): its cells in the table's columns.
 *
 * @example
 * <DocumentLayoutBlockTableRow>
 *   <DocumentLayoutBlockTableCell primary>Lux survey</DocumentLayoutBlockTableCell>
 * </DocumentLayoutBlockTableRow>
 */
export function DocumentLayoutBlockTableRow({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      role="row"
      data-slot="document-layout-block-table-row"
      className={cn("col-span-full grid min-h-9 grid-cols-subgrid", className)}
      {...props}
    />
  );
}

/** Props shared by `DocumentLayoutBlockTableColumn` and `DocumentLayoutBlockTableCell`. */
export interface DocumentLayoutBlockTableCellProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The rows' name column (the table's first): a cell in it names its row (`role="rowheader"`).
   * @default false
   */
  primary?: boolean;
}

const CELL = "flex min-w-0 items-center overflow-hidden px-3 py-1.5";

/**
 * `DocumentLayoutBlockTableColumn` — a column's name in the header row (`role="columnheader"`),
 * cut short to one line.
 *
 * @example
 * <DocumentLayoutBlockTableColumn primary>Name</DocumentLayoutBlockTableColumn>
 */
export function DocumentLayoutBlockTableColumn({
  primary = false,
  className,
  children,
  ...props
}: DocumentLayoutBlockTableCellProps) {
  return (
    <div
      role="columnheader"
      data-slot="document-layout-block-table-column"
      data-primary={primary || undefined}
      className={cn(CELL, className)}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

/**
 * `DocumentLayoutBlockTableCell` — one value (`role="cell"`, or `role="rowheader"` in the
 * `primary` column): its content on one line, clipped at the column's edge (a chip or text that
 * truncates itself).
 *
 * @example
 * <DocumentLayoutBlockTableCell>Open</DocumentLayoutBlockTableCell>
 */
export function DocumentLayoutBlockTableCell({
  primary = false,
  className,
  ...props
}: DocumentLayoutBlockTableCellProps) {
  return (
    <div
      role={primary ? "rowheader" : "cell"}
      data-slot="document-layout-block-table-cell"
      data-primary={primary || undefined}
      className={cn(CELL, "gap-1.5", className)}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockFooter` — the block's last row, ruled above, its link at the end ("Open in
 * Tasks →").
 *
 * @example
 * <DocumentLayoutBlockFooter>
 *   <DocumentLayoutBlockAction render={<a href="/tasks" />} nativeButton={false}>Open in Tasks →</DocumentLayoutBlockAction>
 * </DocumentLayoutBlockFooter>
 */
export function DocumentLayoutBlockFooter({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="document-layout-block-footer"
      className={cn(
        "flex justify-end border-t border-border px-3 py-1.5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBlockAction` — a link-styled action inside the block's text (Try again, Open in
 * Tasks →): no padding of its own, so it sits in the line, with a 24px target past its glyphs.
 *
 * @example
 * <DocumentLayoutBlockAction onClick={retry}>Try again</DocumentLayoutBlockAction>
 */
export function DocumentLayoutBlockAction({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button
      variant="link"
      size="sm"
      // In the line, 18px tall: a 4px hit area above and below makes its target 26px.
      className={cn(
        "h-auto p-0 after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        className,
      )}
      {...props}
    />
  );
}
