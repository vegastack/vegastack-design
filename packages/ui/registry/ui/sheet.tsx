// @vegastack sheet@0.23.6 sha256-DaIS0McYg4aNd92D7mNVIEX3xv4u1ql00C8wfo9A/w8=

"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { useModalInert } from "@/components/ui/use-modal-inert";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

const SheetModalContext =
  React.createContext<SheetPrimitive.Root.Props["modal"]>(true);

function Sheet({ modal = true, ...props }: SheetPrimitive.Root.Props) {
  return (
    <SheetModalContext.Provider value={modal}>
      <SheetPrimitive.Root data-slot="sheet" modal={modal} {...props} />
    </SheetModalContext.Provider>
  );
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ children, ...props }: SheetPrimitive.Portal.Props) {
  const themeScope = useInternalThemeScope();

  return (
    <SheetPrimitive.Portal data-slot="sheet-portal" {...props}>
      <div className={cn("contents", themeScope)}>{children}</div>
    </SheetPrimitive.Portal>
  );
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  ref,
  side = "right",
  showCloseButton = true,
  size = "default",
  closeLabel = "Close",
  showOverlay = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
  size?: "sm" | "default" | "lg" | "xl";
  closeLabel?: string;
  /** `false` drops the dimmed backdrop — for a non-modal panel docked beside the page. */
  showOverlay?: boolean;
}) {
  const modal = React.useContext(SheetModalContext);
  const popupRef = useModalInert<HTMLDivElement>({
    ref,
    enabled: modal === true,
  });

  return (
    <SheetPortal>
      {showOverlay ? <SheetOverlay /> : null}
      <SheetPrimitive.Popup
        ref={popupRef}
        data-slot="sheet-content"
        data-side={side}
        data-size={size}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg outline-none transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-full data-[side=left]:sm:w-3/4 data-[side=left]:border-e data-[side=left]:data-ending-style:translate-x-[-2.5rem] rtl:data-[side=left]:data-ending-style:-translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] rtl:data-[side=left]:data-starting-style:-translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-full data-[side=right]:sm:w-3/4 data-[side=right]:border-s data-[side=right]:data-ending-style:translate-x-[2.5rem] rtl:data-[side=right]:data-ending-style:-translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] rtl:data-[side=right]:data-starting-style:-translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-[side=left]:data-[size=sm]:sm:max-w-xs data-[side=right]:data-[size=sm]:sm:max-w-xs data-[side=left]:data-[size=lg]:sm:max-w-2xl data-[side=right]:data-[size=lg]:sm:max-w-2xl data-[side=left]:data-[size=xl]:sm:max-w-5xl data-[side=right]:data-[size=xl]:sm:max-w-5xl",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 end-3"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">{closeLabel}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 has-data-[slot=sheet-action]:grid has-data-[slot=sheet-action]:grid-cols-[1fr_auto] has-data-[slot=sheet-action]:gap-x-4",
        className,
      )}
      {...props}
    />
  );
}

function SheetAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end me-8",
        className,
      )}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex flex-wrap items-center justify-end gap-2 p-4 *:data-[slot=sheet-cancel]:me-auto",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetAction,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
