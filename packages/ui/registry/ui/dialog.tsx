// @vegastack dialog@0.25.92 sha256-Nym0xMsfMTpj/+tnaVVw6y8Y4vos92KPNDkg+6/IC2g=

"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn, mergeRefs } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { useModalInert } from "@/components/ui/use-modal-inert";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

const DialogModalContext =
  React.createContext<DialogPrimitive.Root.Props["modal"]>(true);

function Dialog({ modal = true, ...props }: DialogPrimitive.Root.Props) {
  return (
    <DialogModalContext.Provider value={modal}>
      <DialogPrimitive.Root data-slot="dialog" modal={modal} {...props} />
    </DialogModalContext.Provider>
  );
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ children, ...props }: DialogPrimitive.Portal.Props) {
  const themeScope = useInternalThemeScope();

  return (
    <DialogPrimitive.Portal data-slot="dialog-portal" {...props}>
      <div className={cn("contents", themeScope)}>{children}</div>
    </DialogPrimitive.Portal>
  );
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Where focus lands when the popup opens: the first field or control in the content, never the
 * close ×, else the popup itself — so opening it never lights up the × (FOC-13).
 */
function initialFocusTarget(popup: HTMLElement | null): HTMLElement | true {
  if (!popup) return true;
  const first = Array.from(
    popup.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), select:not(:disabled), [contenteditable="true"], button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).find((el) => !el.closest('[data-slot$="-close"]'));
  return first ?? popup;
}

function DialogContent({
  className,
  children,
  ref,
  showCloseButton = true,
  size = "default",
  closeLabel = "Close",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  size?: "sm" | "default" | "md" | "lg" | "xl" | "fullscreen";
  closeLabel?: string;
}) {
  const modal = React.useContext(DialogModalContext);
  const popupRef = useModalInert<HTMLDivElement>({
    ref,
    enabled: modal === true,
  });
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(
    () => mergeRefs(popupRef, nodeRef),
    [popupRef],
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={mergedRef}
        initialFocus={() => initialFocusTarget(nodeRef.current)}
        data-slot="dialog-content"
        data-size={size}
        className={cn(
          "fixed top-1/2 start-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] grid-cols-1 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm wrap-break-word text-popover-foreground border border-border duration-100 outline-none sm:max-w-sm data-[size=sm]:sm:max-w-xs data-[size=md]:sm:max-w-lg data-[size=lg]:sm:max-w-2xl data-[size=xl]:sm:max-w-5xl has-data-[slot=dialog-body]:flex has-data-[slot=dialog-body]:max-h-[calc(100%-2rem)] has-data-[slot=dialog-body]:flex-col data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          // OVL-16 fullscreen: the viewport less a 16px inset (none on a phone), a flex column whose
          // header and footer stay put while the content between them scrolls.
          "data-[size=fullscreen]:flex data-[size=fullscreen]:h-[calc(100dvh-2rem)] data-[size=fullscreen]:max-h-[calc(100dvh-2rem)] data-[size=fullscreen]:flex-col data-[size=fullscreen]:sm:max-w-[calc(100%-2rem)] data-[size=fullscreen]:max-sm:h-dvh data-[size=fullscreen]:max-sm:max-h-dvh data-[size=fullscreen]:max-sm:max-w-full data-[size=fullscreen]:max-sm:rounded-none data-[size=fullscreen]:max-sm:border-0 data-[size=fullscreen]:max-sm:pt-[calc(--spacing(4)+env(safe-area-inset-top))] data-[size=fullscreen]:max-sm:pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]",
          // LAY-17: the corner × sits over the header's end; the header keeps clear of it, so a long
          // title wraps before the × instead of running under it.
          showCloseButton && "**:data-[slot=dialog-header]:pe-7",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 end-2 active:not-aria-[haspopup]:translate-y-0 in-data-[size=fullscreen]:max-sm:top-[calc(--spacing(2)+env(safe-area-inset-top))]"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("-mx-4 min-h-0 flex-1 overflow-y-auto px-4", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  closeLabel = "Close",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
  closeLabel?: string;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="secondary" />}>
          {closeLabel}
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-snug font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
