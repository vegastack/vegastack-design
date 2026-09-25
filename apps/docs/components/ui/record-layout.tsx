// @vegastack record-layout@0.23.18 sha256-9s6/rqeeDuBhO2BYBa1yMrCCyDlyPhStLTanBFW+O2M=

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
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
 * viewport. Below `lg` the rail is hidden and `RecordDetailsSheet` — an ⓘ icon button beside the
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
      className={cn("flex min-w-0 items-start gap-8", className)}
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
 * `RecordLayoutRail` — the sticky right rail (320px), shown from `lg` up. It sticks to the top of
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
        "sticky top-0 hidden max-h-[calc(100dvh-var(--record-rail-offset))] w-80 shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain [--record-rail-offset:--spacing(24)] lg:flex",
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
            className={cn("shrink-0 lg:hidden", className)}
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
