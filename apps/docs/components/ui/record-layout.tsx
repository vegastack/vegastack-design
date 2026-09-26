// @vegastack record-layout@0.23.37 sha256-3AUi7jGtm/UqcUhpS/3LlXzK0oyQBeidzapN5dqwYTA=

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

/** Native container props for `RecordLayout`. */
export type RecordLayoutProps = React.ComponentPropsWithRef<"div">;

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
 */
export function RecordLayout({ className, ...props }: RecordLayoutProps) {
  return (
    <div
      data-slot="record-layout"
      className={cn(
        "@container/record-layout flex min-w-0 items-start gap-8",
        className,
      )}
      {...props}
    />
  );
}

/** Native container props for `RecordLayoutMain`. */
export type RecordLayoutMainProps = React.ComponentPropsWithRef<"div">;

/** `RecordLayoutMain` — the main column; it takes the remaining width. @example <RecordLayoutMain>…</RecordLayoutMain> */
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

/** Native `aside` props for `RecordLayoutRail`. */
export type RecordLayoutRailProps = React.ComponentPropsWithRef<"aside">;

/**
 * `RecordLayoutRail` — the sticky right rail (320px), shown from 1024px of the layout's own width (a container query, not the viewport). It sticks to the top of
 * the scroll container and scrolls on its own when taller than the viewport; set
 * `--record-rail-offset` (default `--spacing(24)`) to the height above it (the app's top bar).
 * Name it with `aria-label`.
 *
 * @example
 * <RecordLayoutRail aria-label="Details"><Card size="sm">…</Card></RecordLayoutRail>
 */
export function RecordLayoutRail({
  className,
  ...props
}: RecordLayoutRailProps) {
  return (
    <aside
      data-slot="record-layout-rail"
      className={cn(
        "sticky top-0 hidden max-h-[calc(100dvh-var(--record-rail-offset))] w-80 shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain [--record-rail-offset:--spacing(24)] @min-[64rem]/record-layout:flex",
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
 * @example
 * const { ref, wide } = useRecordLayoutWide();
 * <RecordLayout ref={ref}>…{wide && <RecordLayoutRail>…</RecordLayoutRail>}</RecordLayout>
 */
export function useRecordLayoutWide(): {
  ref: (el: HTMLDivElement | null) => void;
  wide: boolean;
} {
  const [wide, setWide] = React.useState(false);
  const ref = React.useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setWide(el.getBoundingClientRect().width >= 1024);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, wide };
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
