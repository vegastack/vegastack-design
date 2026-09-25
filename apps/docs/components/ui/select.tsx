// @vegastack select@0.23.28 sha256-ALB5wtbhzcp3XP4YMyZLYuCGoERu8OfLHI/mfVtZ3SY=

"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cva } from "class-variance-authority";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react";

import {
  ItemDescriptionContext,
  useItemDescriptionId,
} from "@/components/ui/item";

const Select = SelectPrimitive.Root;

// API-24: the default (outline) trigger takes its width from its parent like every form control;
// `ghost` is the inline tier — content width, no border at rest, the border on hover, on focus
// and while the popup is open. A variant, so a consumer width or border class still wins.
const selectTriggerVariants = cva(
  "flex items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pe-2 ps-2.5 text-sm whitespace-nowrap transition-colors select-none focus:border-ring/70 disabled:cursor-not-allowed disabled:opacity-50 not-focus:aria-invalid:border-destructive data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:not-focus:aria-invalid:border-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        outline: "w-full",
        ghost:
          "w-fit border-transparent hover:border-input data-popup-open:border-input dark:bg-transparent dark:hover:bg-input/50",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-start", className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "default",
  variant = "outline",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
  variant?: "outline" | "ghost";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-variant={variant}
      className={cn(
        selectTriggerVariants({ variant }),
        // API-24: upstream's ButtonGroup sizes an unsized trigger to its content
        // (`[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit`), which a `w-full` default
        // would defeat — so an outline trigger with no width of its own, as a group's direct child,
        // keeps upstream's content width there.
        variant === "outline" &&
          !(typeof className === "string" && /(^|[\s:])w-/.test(className)) &&
          "[[data-slot=button-group]>&]:w-fit",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const themeScope = useInternalThemeScope();

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className={cn("isolate z-50", themeScope)}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md border border-border duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-start-2 data-[side=inline-start]:slide-in-from-end-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  const description = useItemDescriptionId(props["aria-describedby"]);
  return (
    <ItemDescriptionContext.Provider value={description.register}>
      <SelectPrimitive.Item
        data-slot="select-item"
        aria-describedby={description.id || undefined}
        className={cn(
          "relative flex w-full items-center gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:[&:not([data-icon-tone],[data-icon-tone]_*)]:text-accent-foreground data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground focus:**:[svg:not([data-icon-tone])]:text-accent-foreground data-highlighted:**:[svg:not([data-icon-tone])]:text-accent-foreground",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
          {children}
        </SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator
          render={
            <span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center" />
          }
        >
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    </ItemDescriptionContext.Provider>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
