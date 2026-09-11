// @vegastack select@0.7.4 sha256-mqzvcOHIIvtrQ0mAUoEQnTAJDMp8WoZNGCnyx8LofdM=

"use client";

import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  cn,
  fieldControl,
  FLOATING,
  surfaceInteractive,
} from "@vegastack/design";
import {
  FloatingSurface,
  menuItemVariants,
  menuLabelClassName,
  menuSeparatorClassName,
} from "@/components/ui/floating-surface";

/**
 * Trigger variants. `size` mirrors the input/button scale — `sm` (h-(--size-sm)),
 * `default` (h-(--size-md), 32px baseline), and `lg` (h-(--size-lg)) — so selects line up with
 * sibling form controls. Radius `md` (8) matches inputs/buttons. Every value is
 * a semantic token (no hardcoded colors or sizes).
 */
export const selectTriggerVariants = cva(
  [
    // The trigger is a FIELD, so it wears the same chrome as Input/Textarea/OTP — one border
    // grammar across every control a form row can contain (audit B1-11): rest hairline, neutral
    // hover tint, `ring` focus tint, destructive invalid, dimmed disabled, dark inset fill.
    fieldControl,
    "group/select-trigger flex w-full items-center justify-between gap-2 text-base whitespace-nowrap select-none",
    // …and it is also a BUTTON, which a text field is not: it is pressable, so it takes the
    // surface ladder's wash and pressed rung on top of the field chrome. That is the whole
    // distinction — `fieldControl` says what it IS, `surfaceInteractive` says it can be pushed.
    // (SP-04: it used to hover ONLY in dark, via `dark:hover:bg-input/…`.)
    surfaceInteractive,
    "data-[placeholder]:text-muted-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-(--size-sm) px-2.5 text-sm",
        md: "h-(--size-md) px-3",
        lg: "h-(--size-lg) px-3",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/* ------------------------------------------------------------------------------------------------
 * Root + Value + Group — pass-throughs that carry a `data-slot`. `Select` is the
 * Base UI `Select.Root`; it doesn't render an element of its own.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `Select`. */
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
 * **Modal by default** (audit D12): while the listbox is open, background scroll is
 * locked so the trigger cannot slide out from under the popup — the same modality
 * {@link Popover} uses. Pass `modal={false}` for a listbox that leaves the page
 * scrollable and interactive.
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
  return <BaseSelect.Root data-slot="select" modal={modal} {...props} />;
}

/** Props accepted by `SelectValue`. */
export type SelectValueProps = React.ComponentProps<typeof BaseSelect.Value>;

/**
 * `SelectValue` — renders the selected item's label inside the trigger, or the
 * `placeholder` when nothing is selected. Renders a `<span>`.
 *
 * Single-line by default: the value shrinks inside a narrow trigger and elides with an
 * ellipsis (`min-w-0 truncate`). For composite content (icon + label via a children
 * function), pass `className="flex min-w-0 items-center gap-2"` and put `truncate` on
 * the text span — a flex container can't ellipsize its children itself.
 *
 * @example
 * <SelectValue placeholder="Choose a plan" />
 */
export function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <BaseSelect.Value
      data-slot="select-value"
      className={cn("min-w-0 truncate text-start", className)}
      {...props}
    />
  );
}

/** Props accepted by `SelectGroup`. */
export type SelectGroupProps = React.ComponentProps<typeof BaseSelect.Group>;

/**
 * `SelectGroup` — groups related items with a {@link SelectLabel}. Renders a
 * `<div role="group">` auto-associated with its label. Renders a `<div>`.
 *
 * @example
 * <SelectGroup><SelectLabel>Plans</SelectLabel>{items}</SelectGroup>
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

/** Props accepted by `SelectTrigger`. */
export interface SelectTriggerProps
  extends
    React.ComponentProps<typeof BaseSelect.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

/**
 * `SelectTrigger` — the button that opens the popup, with a trailing chevron
 * that flips while open. Focus = the darkened `ring/70` border (button-style trigger:
 * the centralized base.css `:focus-visible` outline also applies for keyboard nav); reflects
 * `aria-invalid`/`disabled`. Renders a `<button>`.
 *
 * @example
 * <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
 */
export function SelectTrigger({
  className,
  size = "md",
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

/** Props accepted by `SelectList`. */
export type SelectListProps = React.ComponentProps<typeof BaseSelect.List>;

/**
 * `SelectList` — the Base UI list wrapper around options inside
 * {@link SelectContent}. Most consumers let `SelectContent` render it
 * automatically; export is available for direct composition and custom list
 * props. Renders a `<div>`.
 *
 * @example
 * <SelectList><SelectItem value="pro">Pro</SelectItem></SelectList>
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

/** Props accepted by `SelectContent`. */
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
  /** Props forwarded to the Base UI `Select.Positioner`.
   * @default undefined
   */
  positionerProps?: React.ComponentProps<typeof BaseSelect.Positioner>;
  /** Props forwarded to the Base UI `Select.List` rendered around the options.
   * @default undefined
   */
  listProps?: SelectListProps;
}

/**
 * `SelectContent` — the dropdown surface: Base UI `Portal` → `Positioner` →
 * `Popup`, with hover scroll arrows for long lists. Enter/exit animate via
 * `data-starting-style`/`data-ending-style`. Sized to at least the trigger width
 * and capped to the available viewport height (scrolls past that). Renders a
 * `<div>`.
 *
 * @example
 * <SelectContent><SelectItem value="pro">Pro</SelectItem></SelectContent>
 */
export function SelectContent({
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
    <FloatingSurface
      parts={{
        Portal: BaseSelect.Portal,
        Positioner: BaseSelect.Positioner,
        Popup: BaseSelect.Popup,
      }}
      slot="select"
      surface="menu"
      positioning={{ side, align, sideOffset, alignItemWithTrigger }}
      positionerProps={positionerProps}
      popupProps={props}
      // The popup is at least as wide as its trigger, and hosts absolutely-positioned scroll
      // arrows — the two things a select popup adds to the shared `menu` surface.
      className="relative min-w-[var(--anchor-width)]"
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
    </FloatingSurface>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Item — an option, with a trailing check indicator for the selected state.
 * `data-highlighted` (keyboard/hover) tints the accent; `data-disabled` dims.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `SelectItem`. */
export type SelectItemProps = React.ComponentProps<typeof BaseSelect.Item>;

/**
 * `SelectItem` — a single option. Shows a trailing check when selected; tints on
 * `data-highlighted` (keyboard nav / hover) and dims on `data-disabled`. Renders
 * a `<div role="option">`.
 *
 * @example
 * <SelectItem value="pro">Pro</SelectItem>
 */
export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      data-slot="select-item"
      className={cn(menuItemVariants({ indicator: "trailing" }), className)}
      {...props}
    >
      <span className="absolute end-2 flex size-(--icon-default) items-center justify-center text-foreground">
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

/** Props accepted by `SelectLabel`. */
export type SelectLabelProps = React.ComponentProps<
  typeof BaseSelect.GroupLabel
>;

/**
 * `SelectLabel` — a heading for a {@link SelectGroup}, auto-associated with it.
 * Muted, small. Renders a `<div>`.
 *
 * @example
 * <SelectLabel>Plans</SelectLabel>
 */
export function SelectLabel({ className, ...props }: SelectLabelProps) {
  return (
    <BaseSelect.GroupLabel
      data-slot="select-label"
      className={cn(menuLabelClassName, className)}
      {...props}
    />
  );
}

/** Props accepted by `SelectSeparator`. */
export type SelectSeparatorProps = React.ComponentProps<
  typeof BaseSelect.Separator
>;

/**
 * `SelectSeparator` — a horizontal divider between items or groups. Renders a
 * `<div role="separator">`.
 *
 * @example
 * <SelectSeparator />
 */
export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <BaseSelect.Separator
      data-slot="select-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  );
}
