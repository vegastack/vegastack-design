// @vegastack dialog@0.4.1 sha256-ITWOHcbLyI/6nuO3Z5MD/DB1yK83F3bZmK8ztyhdMXc=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

/* ------------------------------------------------------------------------------------------------
 * Dialog — a modal overlay built on Base UI's Dialog. Exported FLAT (shadcn-style):
 * `Dialog` (=Root), `DialogTrigger`, `DialogContent` (composes Portal+Backdrop+Viewport+Popup with
 * a `size` CVA prop + close button), `DialogHeader`, `DialogFooter`, `DialogTitle`,
 * `DialogDescription`, `DialogClose`. Enter/exit animate via Base UI's `data-starting-style` /
 * `data-ending-style` data attributes + token-duration transitions.
 *
 * Note: there is intentionally NO mobile-drawer variant here — a full-screen Drawer/Sheet is a
 * separate component (deferred). Dialog stays a centered modal at every breakpoint.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Dialog content size — controls the centered popup's max-width.
 * Mirrors the shared size scale (`xs`/`sm`/`default`/`lg`) plus a near-full-viewport `full`.
 * Every value is a semantic scale token (no hardcoded widths).
 */
export const dialogContentVariants = cva(
  [
    "relative z-(--z-overlay) flex max-h-[calc(100dvh-var(--spacing)*8)] w-full flex-col gap-4",
    // No `outline-none`: Base UI focuses the popup on open, so the centralized base.css
    // `:focus-visible` outline stays as the keyboard-focus indicator (WCAG 2.4.7, register P0-02).
    "rounded-lg border border-border bg-popover p-5 text-base text-popover-foreground shadow-overlay",
    // Enter/exit — scale + fade, token durations + standard easing.
    "origin-center transition-[opacity,transform] duration-fast ease-standard",
    "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
    "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
  ],
  {
    variants: {
      size: {
        xs: "sm:max-w-xs",
        sm: "sm:max-w-sm",
        default: "sm:max-w-md",
        lg: "sm:max-w-lg",
        full: "sm:max-w-4xl",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** The size variants `DialogContent` supports. */
export type DialogContentSize = NonNullable<
  VariantProps<typeof dialogContentVariants>["size"]
>;

/**
 * `Dialog` — the root, controls open/close state. Doesn't render an element itself;
 * compose `DialogTrigger` + `DialogContent` inside it. Modal by default (focus trapped,
 * page scroll locked).
 *
 * @example
 * <Dialog>
 *   <DialogTrigger render={<Button>Open</Button>} />
 *   <DialogContent size="default">
 *     <DialogHeader>
 *       <DialogTitle>Delete project</DialogTitle>
 *       <DialogDescription>This action cannot be undone.</DialogDescription>
 *     </DialogHeader>
 *     <DialogFooter>
 *       <DialogClose render={<Button variant="outline">Cancel</Button>} />
 *       <Button variant="destructive">Delete</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 */
export type DialogProps = React.ComponentProps<typeof BaseDialog.Root>;

/** `Dialog` root; controls the modal's open state and focus-management lifecycle.
 *
 * @example
 * <Dialog />
 */
export function Dialog(props: DialogProps) {
  return <BaseDialog.Root {...props} />;
}

/** Props accepted by `DialogTrigger`. */
export type DialogTriggerProps = React.ComponentProps<
  typeof BaseDialog.Trigger
>;

/**
 * `DialogTrigger` — the control that opens the dialog. Renders a `<button>`;
 * pass `render` to compose it with a `Button` or any other action element.

 *
 * @example
 * <DialogTrigger />
 */
export function DialogTrigger({ className, ...props }: DialogTriggerProps) {
  return (
    <BaseDialog.Trigger
      data-slot="dialog-trigger"
      className={className}
      {...props}
    />
  );
}

/** Props accepted by `DialogContent`. */
export interface DialogContentProps
  extends
    React.ComponentProps<typeof BaseDialog.Popup>,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Max-width size of the centered popup.
   * @default "default"
   */
  size?: DialogContentSize;
  /**
   * Vertical placement of the popup (Wave 2). `center` (default) is the modal
   * position; `top` anchors the popup near the viewport top — the COMPOSER
   * posture (quick-create dialogs, task capture) where the eye starts and
   * follow-up typing happens.
   * @default 'center'
   */
  placement?: "center" | "top";
  /**
   * Render the top-right close (`X`) button.
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Accessible label for the close button.
   * @default "Close"
   */
  closeLabel?: string;
}

/**
 * `DialogContent` — the centered popup. Composes Base UI's `Portal` + `Backdrop` + `Viewport` +
 * `Popup`, applies the `size` width token, animates enter/exit, and renders the close button. Drop
 * `DialogHeader`/`DialogFooter` and the title/description inside it.

 *
 * @example
 * <DialogContent />
 */
export function DialogContent({
  className,
  children,
  size = "default",
  placement = "center",
  showCloseButton = true,
  closeLabel = "Close",
  ...props
}: DialogContentProps) {
  const themeScope = useInternalThemeScope();

  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        data-slot="dialog-backdrop"
        className={cn(
          themeScope,
          "fixed inset-0 z-(--z-overlay) bg-overlay",
          "transition-opacity duration-fast ease-standard",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        )}
      />
      <BaseDialog.Viewport
        data-slot="dialog-viewport"
        data-placement={placement}
        className={cn(
          themeScope,
          "fixed inset-0 z-(--z-overlay) flex justify-center overflow-y-auto overscroll-contain p-4 outline-none",
          placement === "top" ? "items-start pt-16" : "items-center",
        )}
      >
        <BaseDialog.Popup
          data-slot="dialog-content"
          data-size={size}
          data-placement={placement}
          className={cn(themeScope, dialogContentVariants({ size }), className)}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <BaseDialog.Close
              data-slot="dialog-close"
              aria-label={closeLabel}
              className={cn(
                "absolute top-3 end-3 inline-flex size-(--size-md) shrink-0 items-center justify-center",
                "rounded-md text-muted-foreground  select-none",
                "hover:bg-muted hover:text-foreground",
                "[&_svg:not([class*='size-'])]:size-(--icon-default) [&_svg]:pointer-events-none [&_svg]:shrink-0",
              )}
            >
              <X aria-hidden />
            </BaseDialog.Close>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

/** Props accepted by `DialogHeader`. */
export type DialogHeaderProps = React.ComponentProps<"div">;

/**
 * `DialogHeader` — groups the title and description at the top of the content.
 * Clears the close button's footprint with end padding.

 *
 * @example
 * <DialogHeader />
 */
export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex shrink-0 flex-col gap-1.5 pe-10", className)}
      {...props}
    />
  );
}

/** Props accepted by `DialogFooter`. */
export type DialogFooterProps = React.ComponentProps<"div">;

/**
 * `DialogFooter` — the action row at the bottom of the content. Stacks (reversed) on
 * narrow screens, becomes an end-aligned row from the `sm` breakpoint up.

 *
 * @example
 * <DialogFooter />
 */
export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DialogTitle`. */
export type DialogTitleProps = React.ComponentProps<typeof BaseDialog.Title>;

/**
 * `DialogTitle` — the dialog's accessible name. Renders an `<h2>`; Base UI wires it to the
 * popup via `aria-labelledby`. Always include one.

 *
 * @example
 * <DialogTitle />
 */
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn("text-h4 text-foreground", className)}
      {...props}
    />
  );
}

/** Props accepted by `DialogDescription`. */
export type DialogDescriptionProps = React.ComponentProps<
  typeof BaseDialog.Description
>;

/**
 * `DialogDescription` — supporting text under the title. Renders a `<p>`; Base UI wires it to
 * the popup via `aria-describedby`.

 *
 * @example
 * <DialogDescription />
 */
export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={cn(
        "text-base leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DialogClose`. */
export type DialogCloseProps = React.ComponentProps<typeof BaseDialog.Close>;

/**
 * `DialogClose` — closes the dialog. Renders a `<button>`; pass `render` to compose it with a
 * `Button` (e.g. a "Cancel" action in the footer).

 *
 * @example
 * <DialogClose />
 */
export function DialogClose({ className, ...props }: DialogCloseProps) {
  return (
    <BaseDialog.Close
      data-slot="dialog-close-action"
      className={className}
      {...props}
    />
  );
}

/** Props accepted by `DialogTitleBar`. */
export type DialogTitleBarProps = React.ComponentProps<"div">;

/**
 * `DialogTitleBar` — the window-chrome header (Wave 2, from the app-teardown
 * "window-in-app" editor shell): a hairline-bottomed bar across the popup's top
 * for a context chip on the left and window controls (expand, close, `⋮`) on the
 * right. Use it INSTEAD of `DialogHeader` when the dialog behaves like a
 * lightweight window (editors, previews); pass `showCloseButton={false}` to
 * `DialogContent` and compose your own controls here.
 *
 * @example
 * <DialogContent size="lg" showCloseButton={false} className="p-0">
 *   <DialogTitleBar>
 *     <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
 *       <FileText aria-hidden /> <span className="truncate">Meeting notes</span>
 *     </span>
 *     <span className="flex items-center gap-0.5">…icon buttons…</span>
 *   </DialogTitleBar>
 *   …body…
 * </DialogContent>
 */
export function DialogTitleBar({ className, ...props }: DialogTitleBarProps) {
  return (
    <div
      data-slot="dialog-title-bar"
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2",
        "[&_svg:not([class*='size-'])]:size-(--icon-inline)",
        className,
      )}
      {...props}
    />
  );
}
