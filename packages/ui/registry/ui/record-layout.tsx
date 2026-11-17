// @vegastack record-layout@0.101.0 sha256-qxoDGtOMKFtP5lHIBduw9u4S1Zfxe3JTff00QfBbqXU=

import * as React from "react";
import { cn } from "@vegastack/design";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------------------------------------
 * RecordLayout — a record page's main column: the title, the status, the tabs and their panels.
 * A record's details (properties, related work) are not a rail inside the page: they open in the
 * shell's panel beside it (shell layout L7), so the page stays one column at every width.
 * Server-safe.
 * ----------------------------------------------------------------------------------------------*/

/** Native container props for `RecordLayout`. */
export type RecordLayoutProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordLayout` — the record page's frame. Put `RecordLayoutMain` inside it.
 *
 * @example
 * <RecordLayout>
 *   <RecordLayoutMain>
 *     <PageHeader title="Weekly sync" />
 *     <Tabs>…</Tabs>
 *   </RecordLayoutMain>
 * </RecordLayout>
 */
export function RecordLayout({ className, ...props }: RecordLayoutProps) {
  return (
    <div
      data-slot="record-layout"
      className={cn("@container/record-layout flex min-w-0", className)}
      {...props}
    />
  );
}

/** Native container props for `RecordLayoutMain`. */
export type RecordLayoutMainProps = React.ComponentPropsWithRef<"div">;

/** `RecordLayoutMain` — the main column; it takes the whole width. @example <RecordLayoutMain>…</RecordLayoutMain> */
export function RecordLayoutMain({
  className,
  ...props
}: RecordLayoutMainProps) {
  return (
    <div
      data-slot="record-layout-main"
      className={cn("flex min-w-0 flex-1 flex-col gap-6", className)}
      {...props}
    />
  );
}

/** Native container props for `RecordLayoutPanels`. */
export type RecordLayoutPanelsProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordLayoutPanels` — the box under the main column's `TabsList` that holds its `TabsContent`
 * panels, spaced from the tab row; spread `useTabsSwipe()` onto it for touch swiping.
 *
 * @example
 * <RecordLayoutPanels {...swipe}><TabsContent value="summary">…</TabsContent></RecordLayoutPanels>
 */
export function RecordLayoutPanels({
  className,
  ...props
}: RecordLayoutPanelsProps) {
  return (
    <div
      data-slot="record-layout-panels"
      className={cn("min-w-0 pt-2", className)}
      {...props}
    />
  );
}

/** Props for `RecordTabCount`. */
export interface RecordTabCountProps {
  /** The number shown after the tab's label. */
  count: number;
  /** What the count is, read after it by screen readers, e.g. "to review". @default undefined */
  label?: string;
}

/** `RecordTabCount` — a muted count inside a `TabsTrigger`. @example <TabsTrigger value="actions">Actions <RecordTabCount count={3} label="to review" /></TabsTrigger> */
export function RecordTabCount({ count, label }: RecordTabCountProps) {
  return (
    <>
      <span
        aria-hidden
        data-slot="record-tab-count"
        className="text-muted-foreground tabular-nums"
      >
        {count}
      </span>
      <span className="sr-only">
        {count}
        {label ? ` ${label}` : ""}
      </span>
    </>
  );
}

/**
 * `RecordLayoutMainSkeleton` — the main column while the record loads: a title bar, the tab row
 * and the first lines of a text panel (headings and body lines).
 *
 * @example
 * <RecordLayoutMain><RecordLayoutMainSkeleton /></RecordLayoutMain>
 */
export function RecordLayoutMainSkeleton() {
  return (
    <div
      aria-hidden
      data-slot="record-layout-main-skeleton"
      className="flex flex-col gap-6"
    >
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-8 w-56" />
      <div className="flex flex-col gap-3 pt-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-4 w-1/4 mt-3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}

/** Native container props for `RecordTabsRow` and `RecordTabsActions`. */
export type RecordTabsRowProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordTabsRow` — the main column's tab row: the `TabsList` on the left and `RecordTabsActions`
 * (the current tab's icon actions: Copy, Edit) right-aligned at the column's end.
 *
 * @example
 * <RecordTabsRow><TabsList>…</TabsList><RecordTabsActions>…</RecordTabsActions></RecordTabsRow>
 */
export function RecordTabsRow({ className, ...props }: RecordTabsRowProps) {
  return (
    <div
      data-slot="record-tabs-row"
      className={cn(
        "flex min-w-0 items-center justify-between gap-2",
        className,
      )}
      {...props}
    />
  );
}

/** `RecordTabsActions` — the tab row's trailing icon actions. @example <RecordTabsActions><CopyButton value={text} /></RecordTabsActions> */
export function RecordTabsActions({ className, ...props }: RecordTabsRowProps) {
  return (
    <div
      data-slot="record-tabs-actions"
      className={cn("flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  );
}
