// @vegastack select@0.2.0 sha256-jFpSuVN8sjBDwebndzOo3i1edBDEeodLprbhBaSJdU8=

"use client";

import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";

/**
 * Trigger variants. `size` mirrors the input/button scale — `sm` (h-(--size-sm)),
 * `default` (h-(--size-md), 32px baseline), and `lg` (h-(--size-lg)) — so selects line up with
 * sibling form controls. Radius `md` (8) matches inputs/buttons. Every value is
 * a semantic token (no hardcoded colors or sizes).
 */
export const selectTriggerVariants = cva(
  [
    "group/select-trigger flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent text-base whitespace-nowrap transition-[color,box-shadow,border-color] duration-fast ease-standard select-none",
    "focus:border-ring/(--alpha-tint-border)",
    "dark:bg-input/(--alpha-input) dark:hover:bg-input/(--alpha-input-hover)",
    "data-[placeholder]:text-muted-foreground",
    "aria-invalid:border-destructive/(--alpha-tint-border) data-invalid:border-destructive/(--alpha-tint-border)",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--opacity-dim)",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-(--size-sm) px-2.5 text-sm",
        default: "h-(--size-md) px-3",
        lg: "h-(--size-lg) px-3",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/* ------------------------------------------------------------------------------------------------
 * Root + Value + Group — pass-throughs that carry a `data-slot`. `Select` is the
 * Base UI `Select.Root`; it doesn't render an element of its own.
 * ----------------------------------------------------------------------------------------------*/

export type SelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> = React.ComponentProps<typeof BaseSelect.Root<Value, Multiple>>;

/**
 * `Select` — the root. Groups all parts and owns the value/open state. Doesn't
 * render its own element. Use controlled (`value` + `onValueChange`) or
 * uncontrolled (`defaultValue`); pass `items` so {@link SelectValue} can render a
 * selected item's label instead of its raw value.
 *
 * @example
 * <Select defaultValue="serif">
 *   <SelectTrigger><SelectValue placeholder="Pick a font" /></SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="sans">Sans-serif</SelectItem>
 *     <SelectItem value="serif">Serif</SelectItem>
 *   </SelectContent>
 * </Select>
 */
export function Select<Value, Multiple extends boolean | undefined = false>({
  modal = true,
  ...props
}: SelectProps<Value, Multiple>) {
  // Modal by default: lock background scroll while the listbox is open so the
  // trigger stays anchored (consistent with our menus/popovers). Overridable.
  return <BaseSelect.Root data-slot="select" modal={modal} {...props} />;
}

export type SelectValueProps = React.ComponentProps<typeof BaseSelect.Value>;

/**
 * `SelectValue` — renders the selected item's label inside the trigger, or the
 * `placeholder` when nothing is selected. Renders a `<span>`.
 *
 * Single-line by default: the value shrinks inside a narrow trigger and elides with an
 * ellipsis (`min-w-0 truncate`). For composite content (icon + label via a children
 * function), pass `className="flex min-w-0 items-center gap-2"` and put `truncate` on
 * the text span — a flex container can't ellipsize its children itself.
 */
export function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <BaseSelect.Value
      data-slot="select-value"
      className={cn("min-w-0 truncate text-left", className)}
      {...props}
    />
  );
}

export type SelectGroupProps = React.ComponentProps<typeof BaseSelect.Group>;

/**
 * `SelectGroup` — groups related items with a {@link SelectLabel}. Renders a
 * `<div role="group">` auto-associated with its label. Renders a `<div>`.
 */
export function SelectGroup({ className, ...props }: SelectGroupProps) {
  return (
    <BaseSelect.Group
      data-slot="select-group"
      className={cn(className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Trigger — the button. Forwards a ref, owns the `size` variant, renders the
 * chevron via Base UI `Select.Icon`. Open-state rotates the chevron.
 * ----------------------------------------------------------------------------------------------*/

export interface SelectTriggerProps
  extends
    React.ComponentProps<typeof BaseSelect.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

/**
 * `SelectTrigger` — the button that opens the popup, with a trailing chevron
 * that flips while open. Focus = the darkened `ring/70` border (button-style trigger:
 * the centralized base.css `:focus-visible` outline also applies for keyboard nav); reflects
 * `aria-invalid`/`disabled`. Renders a `<button>`.
 */
export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(selectTriggerVariants({ size }), className)}
      {...props}
    >
      {children}
      <BaseSelect.Icon
        data-slot="select-icon"
        className="flex items-center justify-center text-muted-foreground transition-transform duration-fast ease-standard group-data-[popup-open]/select-trigger:rotate-180"
      >
        <ChevronDown className="size-(--icon-default)" aria-hidden />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Content — Portal + Positioner + Popup, with scroll arrows. Enter/exit via
 * `data-starting-style`/`data-ending-style` + transitions (idiomatic Base UI).
 * ----------------------------------------------------------------------------------------------*/

export type SelectListProps = React.ComponentProps<typeof BaseSelect.List>;

/**
 * `SelectList` — the Base UI list wrapper around options inside
 * {@link SelectContent}. Most consumers let `SelectContent` render it
 * automatically; export is available for direct composition and custom list
 * props. Renders a `<div>`.
 */
export function SelectList({ className, ...props }: SelectListProps) {
  return (
    <BaseSelect.List
      data-slot="select-list"
      className={cn(className)}
      {...props}
    />
  );
}

export interface SelectContentProps extends React.ComponentProps<
  typeof BaseSelect.Popup
> {
  /** Preferred side of the trigger to render against. @default 'bottom' */
  side?: React.ComponentProps<typeof BaseSelect.Positioner>["side"];
  /** Alignment relative to the trigger. @default 'start' */
  align?: React.ComponentProps<typeof BaseSelect.Positioner>["align"];
  /** Gap in px between the trigger and the popup. @default 4 */
  sideOffset?: number;
  /**
   * Whether to align the selected item text over the trigger value. Base UI
   * enables this by default; set `false` when you want the popup edge to align
   * with the trigger instead and for `side`/`align` to apply immediately.
   * @default true
   */
  alignItemWithTrigger?: React.ComponentProps<
    typeof BaseSelect.Positioner
  >["alignItemWithTrigger"];
  /** Props forwarded to the Base UI `Select.Positioner`. */
  positionerProps?: React.ComponentProps<typeof BaseSelect.Positioner>;
  /** Props forwarded to the Base UI `Select.List` rendered around the options. */
  listProps?: SelectListProps;
}

/**
 * `SelectContent` — the dropdown surface: Base UI `Portal` → `Positioner` →
 * `Popup`, with hover scroll arrows for long lists. Enter/exit animate via
 * `data-starting-style`/`data-ending-style`. Sized to at least the trigger width
 * and capped to the available viewport height (scrolls past that). Renders a
 * `<div>`.
 */
export function SelectContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = FLOATING.sideOffsetAttached,
  alignItemWithTrigger = true,
  positionerProps,
  listProps,
  ...props
}: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        data-slot="select-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="z-(--z-overlay) outline-none"
        {...positionerProps}
      >
        <BaseSelect.Popup
          data-slot="select-content"
          className={cn(
            "relative z-(--z-overlay) max-h-[var(--available-height)] min-w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-overlay",
            // `scale` must be listed explicitly — Tailwind v4 `scale-*` sets the CSS `scale`
            // property, which `transform` does not cover (register P0-06; matches every sibling).
            "transition-[transform,scale,opacity] duration-fast ease-standard",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          <BaseSelect.ScrollUpArrow
            data-slot="select-scroll-up"
            className="z-(--z-raised) flex h-6 w-full cursor-default items-center justify-center rounded-t-lg bg-popover text-muted-foreground"
          >
            <ChevronUp className="size-(--icon-default)" aria-hidden />
          </BaseSelect.ScrollUpArrow>
          <SelectList {...listProps}>{children}</SelectList>
          <BaseSelect.ScrollDownArrow
            data-slot="select-scroll-down"
            className="z-(--z-raised) flex h-6 w-full cursor-default items-center justify-center rounded-b-lg bg-popover text-muted-foreground"
          >
            <ChevronDown className="size-(--icon-default)" aria-hidden />
          </BaseSelect.ScrollDownArrow>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Item — an option, with a trailing check indicator for the selected state.
 * `data-highlighted` (keyboard/hover) tints the accent; `data-disabled` dims.
 * ----------------------------------------------------------------------------------------------*/

export type SelectItemProps = React.ComponentProps<typeof BaseSelect.Item>;

/**
 * `SelectItem` — a single option. Shows a trailing check when selected; tints on
 * `data-highlighted` (keyboard nav / hover) and dims on `data-disabled`. Renders
 * a `<div role="option">`.
 */
export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-base outline-none select-none",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim)",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-(--icon-default) items-center justify-center text-foreground">
        <BaseSelect.ItemIndicator data-slot="select-item-indicator">
          <Check className="size-(--icon-default)" aria-hidden />
        </BaseSelect.ItemIndicator>
      </span>
      <BaseSelect.ItemText
        data-slot="select-item-text"
        className="flex items-center gap-2"
      >
        {children}
      </BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Label + Separator — group heading and divider.
 * ----------------------------------------------------------------------------------------------*/

export type SelectLabelProps = React.ComponentProps<
  typeof BaseSelect.GroupLabel
>;

/**
 * `SelectLabel` — a heading for a {@link SelectGroup}, auto-associated with it.
 * Muted, small. Renders a `<div>`.
 */
export function SelectLabel({ className, ...props }: SelectLabelProps) {
  return (
    <BaseSelect.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-label-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type SelectSeparatorProps = React.ComponentProps<
  typeof BaseSelect.Separator
>;

/**
 * `SelectSeparator` — a horizontal divider between items or groups. Renders a
 * `<div role="separator">`.
 */
export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <BaseSelect.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}
