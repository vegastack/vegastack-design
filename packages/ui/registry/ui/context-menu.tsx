// @vegastack context-menu@0.23.21 sha256-Io5KpWfyt0tnjVd6XTaOkcC5uXU3Yprz4EOPoB15HYc=

"use client";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { ChevronRightIcon, CheckIcon } from "lucide-react";

import {
  ItemDescriptionContext,
  useItemDescriptionId,
} from "@/components/ui/item";

function ContextMenu({ ...props }: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuPortal({
  children,
  ...props
}: ContextMenuPrimitive.Portal.Props) {
  const themeScope = useInternalThemeScope();

  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props}>
      <div className={cn("contents", themeScope)}>{children}</div>
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuTrigger({
  className,
  ...props
}: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn("select-none", className)}
      {...props}
    />
  );
}

function ContextMenuContent({
  className,
  align = "start",
  alignOffset = 4,
  side = "inline-end",
  sideOffset = 0,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<
    ContextMenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const themeScope = useInternalThemeScope();

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        className={cn("isolate z-50 outline-none", themeScope)}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md border border-border duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-start-2 data-[side=inline-start]:slide-in-from-end-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuGroup({ ...props }: ContextMenuPrimitive.Group.Props) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  );
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: ContextMenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.GroupLabel
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:ps-7",
        className,
      )}
      {...props}
    />
  );
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: ContextMenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const description = useItemDescriptionId(props["aria-describedby"]);
  return (
    <ItemDescriptionContext.Provider value={description.register}>
      <ContextMenuPrimitive.Item
        data-slot="context-menu-item"
        aria-describedby={description.id || undefined}
        data-inset={inset}
        data-variant={variant}
        className={cn(
          "group/context-menu-item relative flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive-text dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus:*:[svg:not([data-icon-tone])]:text-accent-foreground data-[variant=destructive]:*:[svg:not([data-icon-tone])]:text-destructive [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground focus:**:[svg:not([data-icon-tone])]:text-accent-foreground data-open:**:[svg:not([data-icon-tone])]:text-accent-foreground",
          className,
        )}
        {...props}
      />
    </ItemDescriptionContext.Provider>
  );
}

function ContextMenuSub({ ...props }: ContextMenuPrimitive.SubmenuRoot.Props) {
  return (
    <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />
  );
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-7 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground focus:**:[svg:not([data-icon-tone])]:text-accent-foreground data-open:**:[svg:not([data-icon-tone])]:text-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="rtl:rotate-180 ms-auto" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}

function ContextMenuSubContent({
  ...props
}: React.ComponentProps<typeof ContextMenuContent>) {
  return (
    <ContextMenuContent
      data-slot="context-menu-sub-content"
      className="shadow-lg"
      side="inline-end"
      {...props}
    />
  );
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props & {
  inset?: boolean;
}) {
  const description = useItemDescriptionId(props["aria-describedby"]);
  return (
    <ItemDescriptionContext.Provider value={description.register}>
      <ContextMenuPrimitive.CheckboxItem
        data-slot="context-menu-checkbox-item"
        aria-describedby={description.id || undefined}
        data-inset={inset}
        className={cn(
          "relative flex items-center gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-7 data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground focus:**:[svg:not([data-icon-tone])]:text-accent-foreground data-open:**:[svg:not([data-icon-tone])]:text-accent-foreground",
          className,
        )}
        checked={checked}
        {...props}
      >
        <span className="pointer-events-none absolute end-2">
          <ContextMenuPrimitive.CheckboxItemIndicator>
            <CheckIcon />
          </ContextMenuPrimitive.CheckboxItemIndicator>
        </span>
        {children}
      </ContextMenuPrimitive.CheckboxItem>
    </ItemDescriptionContext.Provider>
  );
}

function ContextMenuRadioGroup({
  ...props
}: ContextMenuPrimitive.RadioGroup.Props) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  );
}

function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: ContextMenuPrimitive.RadioItem.Props & {
  inset?: boolean;
}) {
  const description = useItemDescriptionId(props["aria-describedby"]);
  return (
    <ItemDescriptionContext.Provider value={description.register}>
      <ContextMenuPrimitive.RadioItem
        data-slot="context-menu-radio-item"
        aria-describedby={description.id || undefined}
        data-inset={inset}
        className={cn(
          "relative flex items-center gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-7 data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground focus:**:[svg:not([data-icon-tone])]:text-accent-foreground data-open:**:[svg:not([data-icon-tone])]:text-accent-foreground",
          className,
        )}
        {...props}
      >
        <span className="pointer-events-none absolute end-2">
          <ContextMenuPrimitive.RadioItemIndicator>
            <CheckIcon />
          </ContextMenuPrimitive.RadioItemIndicator>
        </span>
        {children}
      </ContextMenuPrimitive.RadioItem>
    </ItemDescriptionContext.Provider>
  );
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-focus/context-menu-item:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
