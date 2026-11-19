// @vegastack record-layout@0.123.3 sha256-OJ2wBPvGByrIyyHkRObusviWOjEfFIYWi9f45sINp3c=

import * as React from "react";
import { cn } from "@vegastack/design";
import { Skeleton } from "@/components/ui/skeleton";

// The side panel is the one client part; it lives in its own file so this one stays server-safe.
export {
  RecordPanel,
  RecordPanelAction,
  RecordPanelEmpty,
  RecordPanelItem,
  RecordPanelList,
  RecordPanelProvider,
  RecordPanelSection,
  RecordPanelToggle,
  RecordPanelTrigger,
  useRecordPanel,
  type RecordPanelActionProps,
  type RecordPanelControls,
  type RecordPanelDock,
  type RecordPanelEmptyProps,
  type RecordPanelItemProps,
  type RecordPanelListProps,
  type RecordPanelProps,
  type RecordPanelProviderProps,
  type RecordPanelSectionProps,
  type RecordPanelToggleProps,
  type RecordPanelTriggerProps,
} from "@/components/ui/record-layout-side";

/* ------------------------------------------------------------------------------------------------
 * RecordLayout — a record page: the main column (the work, in reading order: title, description,
 * subtasks or decisions, activity and comments) and, after it, `RecordPanel`: one 320px side panel
 * of stacked sections, flush to the page's right edge (record side panel R1–R5).
 *
 * In the shell it fills the page edge to edge — under the page bar, to the page's right and bottom
 * edges, past the page gutter — so the panel's divider runs the page's full height; the main
 * column takes the gutter back as its padding and scrolls on its own, as the panel does.
 *
 *   record width     side panel                                    content
 *   ≥ dockAt         docks beside the main column (open on load)  keeps its width, re-centred
 *   below it         ▥ floats it over the page, edge to edge      stays where it was
 *   < 640px window   a bottom sheet from the "Details" button     full width
 *
 * `RecordPanelProvider`'s `dockAt` (69rem by default; 74, 75 or 95 for wider pages) is the record
 * width the main column's measure and the panel need side by side.
 *
 * The content keeps its own width and centres itself in the main column (`ShellSection`
 * `measure="prose"`, 720px; `DocumentLayout` for a page read as a document). A docked panel narrows
 * the main column, so the content slides to stay centred in what remains, animated with the
 * panel's width on a person's click. Server-safe; the panel's parts are client leaves in
 * `record-layout-side`.
 * ----------------------------------------------------------------------------------------------*/

/** Native container props for `RecordLayout`. */
export type RecordLayoutProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordLayout` — the record page's frame: `RecordLayoutMain`, then `RecordPanel`. Inside a
 * `ShellPage` it reaches past the page gutter to the page's edges.
 *
 * @example
 * <RecordLayout>
 *   <RecordLayoutMain>
 *     <PageHeader title="Weekly sync" />
 *     <RecordPanelTrigger />
 *   </RecordLayoutMain>
 *   <RecordPanel>…</RecordPanel>
 * </RecordLayout>
 */
export function RecordLayout({ className, ...props }: RecordLayoutProps) {
  return (
    <div
      data-slot="record-layout"
      className={cn(
        // Past the shell page's gutter on every side (outside a shell the gutter is unset: no
        // margin), as tall as the page, so the panel runs from the bar to the page's bottom.
        "@container/record-layout relative -m-(--page-gutter) flex min-h-0 min-w-0 flex-1 max-sm:flex-col",
        className,
      )}
      {...props}
    />
  );
}

/** Native container props for `RecordLayoutMain`. */
export type RecordLayoutMainProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordLayoutMain` — the main column: it takes the width the panel leaves, pads itself with the
 * page gutter and, from 640px, scrolls on its own.
 *
 * @example
 * <RecordLayoutMain>…</RecordLayoutMain>
 */
export function RecordLayoutMain({
  className,
  ...props
}: RecordLayoutMainProps) {
  return (
    <div
      data-slot="record-layout-main"
      className={cn(
        // `relative`: a scroller is the containing block of what it scrolls, so an absolute child
        // (a screen-reader-only label, a cue) never escapes to the page's scroller and gives it a
        // second scrollbar (BRD-SCR, operator 2026-11-19).
        "relative flex min-w-0 flex-1 flex-col gap-6 p-(--page-gutter) sm:min-h-0 sm:overflow-y-auto sm:overscroll-contain",
        className,
      )}
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
