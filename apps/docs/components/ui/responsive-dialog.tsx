// @vegastack responsive-dialog@0.23.115 sha256-RNw1rL/Vur2JIGqHacP8eE+Zzd4gjWmKwicY5NpvkLE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/components/ui/use-mobile";

/* ------------------------------------------------------------------------------------------------
 * ResponsiveDialog — one overlay API that is a centred `Dialog` from 768px up and a bottom `Sheet`
 * below it: the same header, body and footer, a drag handle, a footer that stays at the bottom and
 * clears the home indicator (safe-area inset). The consumer writes no layout code and no
 * `useIsMobile` branch; crossing the breakpoint swaps the container. Both are Base UI Dialog, so
 * the focus trap, Escape and focus return are the same in either.
 * ----------------------------------------------------------------------------------------------*/

const ResponsiveDialogContext = React.createContext(false);

/** Whether the nearest `ResponsiveDialog` is showing its phone (bottom sheet) form. */
function useResponsiveMobile(): boolean {
  return React.useContext(ResponsiveDialogContext);
}

/** Props for `ResponsiveDialog` — `Dialog`'s own. */
export type ResponsiveDialogProps = React.ComponentProps<typeof Dialog> & {
  /**
   * Viewport width (px) at and above which it is a Dialog; below it, a bottom Sheet.
   * @default 768
   */
  breakpoint?: number;
};

/**
 * `ResponsiveDialog` — the root: a `Dialog` on wide screens, a bottom `Sheet` on phones. Takes
 * `Dialog`'s props (`open`, `onOpenChange`, `defaultOpen`, `modal`).
 *
 * @example
 * <ResponsiveDialog open={open} onOpenChange={setOpen}>
 *   <ResponsiveDialogContent size="md">
 *     <ResponsiveDialogHeader>
 *       <ResponsiveDialogTitle>Members · Product</ResponsiveDialogTitle>
 *     </ResponsiveDialogHeader>
 *     <ResponsiveDialogBody>…</ResponsiveDialogBody>
 *     <ResponsiveDialogFooter>…</ResponsiveDialogFooter>
 *   </ResponsiveDialogContent>
 * </ResponsiveDialog>
 */
export function ResponsiveDialog({
  breakpoint = 768,
  ...props
}: ResponsiveDialogProps) {
  const mobile = useIsMobile(breakpoint);
  return (
    <ResponsiveDialogContext.Provider value={mobile}>
      {mobile ? <Sheet {...props} /> : <Dialog {...props} />}
    </ResponsiveDialogContext.Provider>
  );
}

/** Props for `ResponsiveDialogTrigger` — `DialogTrigger`'s own. */
export type ResponsiveDialogTriggerProps = React.ComponentProps<
  typeof DialogTrigger
>;

/**
 * `ResponsiveDialogTrigger` — the element that opens it.
 *
 * @example
 * <ResponsiveDialogTrigger render={<Button variant="outline" />}>Members</ResponsiveDialogTrigger>
 */
export function ResponsiveDialogTrigger(props: ResponsiveDialogTriggerProps) {
  return useResponsiveMobile() ? (
    <SheetTrigger {...props} />
  ) : (
    <DialogTrigger {...props} />
  );
}

/** Props for `ResponsiveDialogClose` — `DialogClose`'s own. */
export type ResponsiveDialogCloseProps = React.ComponentProps<
  typeof DialogClose
>;

/**
 * `ResponsiveDialogClose` — closes it, in either form.
 *
 * @example
 * <ResponsiveDialogClose render={<Button variant="secondary" />}>Cancel</ResponsiveDialogClose>
 */
export function ResponsiveDialogClose(props: ResponsiveDialogCloseProps) {
  return useResponsiveMobile() ? (
    <SheetClose {...props} />
  ) : (
    <DialogClose {...props} />
  );
}

/** Props for `ResponsiveDialogContent`. */
export type ResponsiveDialogContentProps = React.ComponentProps<
  typeof DialogContent
>;

/**
 * `ResponsiveDialogContent` — the popup. `size` sizes the Dialog (`sm` … `xl`, see Dialog); the
 * phone sheet is always full width, as tall as its content up to 85% of the viewport, with a drag
 * handle at the top.
 *
 * @example
 * <ResponsiveDialogContent size="md">…</ResponsiveDialogContent>
 */
export function ResponsiveDialogContent({
  size,
  className,
  children,
  ...props
}: ResponsiveDialogContentProps) {
  if (useResponsiveMobile()) {
    return (
      <SheetContent
        side="bottom"
        data-responsive-dialog=""
        className={cn("rounded-t-xl", className)}
        {...props}
      >
        <div
          aria-hidden
          data-slot="responsive-dialog-handle"
          className="mx-auto mt-2 -mb-2 h-1 w-10 shrink-0 rounded-full bg-muted"
        />
        {children}
      </SheetContent>
    );
  }
  return (
    <DialogContent
      size={size}
      data-responsive-dialog=""
      className={className}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

/**
 * `ResponsiveDialogHeader` — the title block.
 *
 * @example
 * <ResponsiveDialogHeader><ResponsiveDialogTitle>Share</ResponsiveDialogTitle></ResponsiveDialogHeader>
 */
export function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return useResponsiveMobile() ? (
    <SheetHeader className={cn("pb-0", className)} {...props} />
  ) : (
    <DialogHeader className={className} {...props} />
  );
}

/**
 * `ResponsiveDialogTitle` — the accessible name.
 *
 * @example
 * <ResponsiveDialogTitle>Members</ResponsiveDialogTitle>
 */
export function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof DialogTitle>,
) {
  return useResponsiveMobile() ? (
    <SheetTitle {...props} />
  ) : (
    <DialogTitle {...props} />
  );
}

/**
 * `ResponsiveDialogDescription` — the muted line under the title.
 *
 * @example
 * <ResponsiveDialogDescription>Everyone in the workspace is a member.</ResponsiveDialogDescription>
 */
export function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>,
) {
  return useResponsiveMobile() ? (
    <SheetDescription {...props} />
  ) : (
    <DialogDescription {...props} />
  );
}

/**
 * `ResponsiveDialogBody` — the scrolling middle, between the header and the footer.
 *
 * @example
 * <ResponsiveDialogBody>…long list…</ResponsiveDialogBody>
 */
export function ResponsiveDialogBody(props: React.ComponentProps<"div">) {
  return useResponsiveMobile() ? (
    <SheetBody {...props} />
  ) : (
    <DialogBody {...props} />
  );
}

/**
 * `ResponsiveDialogFooter` — the actions. On a phone it stays at the sheet's bottom and clears
 * the home indicator.
 *
 * @example
 * <ResponsiveDialogFooter><Button>Add</Button></ResponsiveDialogFooter>
 */
export function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return useResponsiveMobile() ? (
    <SheetFooter
      className={cn(
        "pb-[calc(var(--spacing)*4+env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  ) : (
    <DialogFooter className={className} {...props} />
  );
}
