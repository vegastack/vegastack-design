// @vegastack record-layout@0.24.4 sha256-c0n13KCi/bJONrWQCldKe5wNvITABbl5FVmwGPv6aSc=

"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* ------------------------------------------------------------------------------------------------
 * RecordLayout — a record page's two columns: the main column (title, status, tabs) and a sticky
 * right rail of cards (properties, related work) that scrolls on its own when it is taller than the
 * viewport. Below that the rail is hidden and `RecordDetailsSheet` — an ⓘ icon button beside the
 * title — opens the same details in a Sheet from the right (full screen on a phone). Server-safe:
 * the switch is CSS, so both branches may be mounted; mount rail content once (with your own
 * `useMediaQuery`) when it holds state that must not be duplicated.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `RecordLayout`. */
export interface RecordLayoutProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Below the 64rem layout width, flow the rail under the main column instead of hiding it: one
   * column, the rail full width in ordinary flow — not sticky, no scroller of its own — so the
   * page has one scroller and `RecordDetailsSheet` is not needed (mount the rail always). From
   * 64rem it is the normal sticky rail beside the main column.
   * @default false
   */
  stack?: boolean;
}

/** Whether the enclosing `RecordLayout` stacks (`stack`), read by its main column and rail. */
const RecordLayoutStackContext = React.createContext(false);

/**
 * `RecordLayout` — the two-column frame. Put `RecordLayoutMain` first and `RecordLayoutRail` second.
 *
 * @example
 * <RecordLayout>
 *   <RecordLayoutMain>
 *     <PageHeader title="Weekly sync" actions={<RecordDetailsSheet>{facts}</RecordDetailsSheet>} />
 *     <Tabs>…</Tabs>
 *   </RecordLayoutMain>
 *   <RecordLayoutRail aria-label="Details">
 *     <Card size="sm">…</Card>
 *   </RecordLayoutRail>
 * </RecordLayout>
 *
 * @example
 * // A file page: the details flow under the preview below 64rem, with one scroller.
 * <RecordLayout stack>
 *   <RecordLayoutMain>…the preview…</RecordLayoutMain>
 *   <RecordLayoutRail aria-label="Details">…</RecordLayoutRail>
 * </RecordLayout>
 */
export function RecordLayout({
  className,
  stack = false,
  ...props
}: RecordLayoutProps) {
  return (
    <RecordLayoutStackContext.Provider value={stack}>
      <div
        data-slot="record-layout"
        data-stack={stack ? "" : undefined}
        className={cn(
          "@container/record-layout flex min-w-0 items-start gap-8",
          // Stacked: the main column takes the whole first line below 64rem, so the rail wraps
          // under it.
          stack && "flex-wrap",
          className,
        )}
        {...props}
      />
    </RecordLayoutStackContext.Provider>
  );
}

/** Native container props for `RecordLayoutMain`. */
export type RecordLayoutMainProps = React.ComponentPropsWithRef<"div">;

/** `RecordLayoutMain` — the main column; it takes the remaining width. @example <RecordLayoutMain>…</RecordLayoutMain> */
export function RecordLayoutMain({
  className,
  ...props
}: RecordLayoutMainProps) {
  const stack = React.useContext(RecordLayoutStackContext);
  return (
    <div
      data-slot="record-layout-main"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-6",
        stack && "basis-full @min-[64rem]/record-layout:basis-0",
        className,
      )}
      {...props}
    />
  );
}

/** Native `aside` props for `RecordLayoutRail`. */
export type RecordLayoutRailProps = React.ComponentPropsWithRef<"aside">;

/**
 * `RecordLayoutRail` — the sticky right rail (320px), shown from 1024px of the layout's own width
 * (a container query, not the viewport). It sticks `--record-rail-gap` below the top of the scroll
 * container — by default `--page-gutter`, the gutter `AppShellPage` pads with (32px outside one),
 * which is the same gap it has at rest, so it never slides under the header —
 * and scrolls on its own when taller than the viewport minus that gap above and below. Set
 * `--record-rail-offset` (default `--spacing(14)`, `AppShellHeader`'s height) to the height of the
 * chrome above the scroll container. Name it with `aria-label`. In a `RecordLayout stack` it is
 * shown at every width: below 64rem it flows under the main column, full width, in ordinary flow.
 *
 * @example
 * <RecordLayoutRail aria-label="Details"><Card size="sm">…</Card></RecordLayoutRail>
 */
export function RecordLayoutRail({
  className,
  ...props
}: RecordLayoutRailProps) {
  const stack = React.useContext(RecordLayoutStackContext);
  return (
    <aside
      data-slot="record-layout-rail"
      className={cn(
        "[--record-rail-gap:var(--page-gutter,--spacing(8))] [--record-rail-offset:--spacing(14)]",
        stack
          ? "flex w-full min-w-0 shrink-0 flex-col gap-4 @min-[64rem]/record-layout:sticky @min-[64rem]/record-layout:top-(--record-rail-gap) @min-[64rem]/record-layout:max-h-[calc(100dvh-var(--record-rail-offset)-2*var(--record-rail-gap))] @min-[64rem]/record-layout:w-80 @min-[64rem]/record-layout:self-start @min-[64rem]/record-layout:overflow-y-auto @min-[64rem]/record-layout:overscroll-contain"
          : "sticky top-(--record-rail-gap) hidden max-h-[calc(100dvh-var(--record-rail-offset)-2*var(--record-rail-gap))] w-80 shrink-0 flex-col gap-4 self-start overflow-y-auto overscroll-contain @min-[64rem]/record-layout:flex",
        className,
      )}
      {...props}
    />
  );
}

/** Props for `RecordDetailsSheet`. */
export interface RecordDetailsSheetProps {
  /** What the sheet shows — usually the same `PropertyList` as the rail's first card. */
  children: React.ReactNode;
  /**
   * The sheet's title, and the trigger's accessible name.
   * @default "Details"
   */
  title?: string;
  /** Controlled open state. @default undefined */
  open?: boolean;
  /** Called when the sheet opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** Classes for the ⓘ trigger button. @default undefined */
  className?: string;
}

/**
 * `RecordDetailsSheet` — the rail's small-screen stand-in: a ghost ⓘ icon button, hidden from `lg`
 * up, that opens `children` in a Sheet from the right (full width on a phone).
 *
 * @example
 * <RecordDetailsSheet><PropertyList>…</PropertyList></RecordDetailsSheet>
 */
export function RecordDetailsSheet({
  children,
  title = "Details",
  open,
  onOpenChange,
  className,
}: RecordDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={title}
            className={cn(
              "shrink-0 @min-[64rem]/record-layout:hidden",
              className,
            )}
          />
        }
      >
        <Info aria-hidden />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
      </SheetContent>
    </Sheet>
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

/**
 * `useRecordLayoutWide` — whether a `RecordLayout` is wide enough for its rail (1024px of its own
 * width, the same container query the rail uses), for mounting rail content once: pass the
 * returned `ref` to `RecordLayout`.
 *
 * The width is unknown on the server and in the first paint, so `wide` is `false` until measured
 * — mount by `rail` and `sheet` instead: both are `true` until the first measure (the CSS switch
 * already shows only the right one, so the server-rendered page has its final layout, rail
 * included), then exactly one is.
 *
 * @example
 * const { ref, rail, sheet } = useRecordLayoutWide();
 * <RecordLayout ref={ref}>
 *   <RecordLayoutMain>
 *     <PageHeader title="Weekly sync" actions={sheet && <RecordDetailsSheet>{facts}</RecordDetailsSheet>} />
 *   </RecordLayoutMain>
 *   {rail && <RecordLayoutRail aria-label="Details">…</RecordLayoutRail>}
 * </RecordLayout>
 */
export function useRecordLayoutWide(): {
  ref: (el: HTMLDivElement | null) => void;
  /** The layout is measured and at least 1024px wide. `false` until measured. */
  wide: boolean;
  /** Mount the rail: until measured, and while wide. */
  rail: boolean;
  /** Mount the small-screen stand-ins (`RecordDetailsSheet`, a rail tab): until measured, and while narrow. */
  sheet: boolean;
} {
  const [wide, setWide] = React.useState<boolean | null>(null);
  const ref = React.useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setWide(el.getBoundingClientRect().width >= 1024);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return {
    ref,
    wide: wide === true,
    rail: wide !== false,
    sheet: wide !== true,
  };
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
