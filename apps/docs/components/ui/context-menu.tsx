// @vegastack context-menu@0.4.1 sha256-NgyJ49X1f0VRDwsRxIczI7LpUNkrP0PU23G1nvHKACM=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

function mergeStateClassName<State>(
  className: string,
  userClassName: string | ((state: State) => string | undefined) | undefined,
) {
  if (typeof userClassName === "function") {
    return (state: State) => cn(className, userClassName(state));
  }

  return cn(className, userClassName);
}

/* ------------------------------------------------------------------------------------------------
 * Root / Trigger / Group / Sub — structural parts. Base UI's `ContextMenu.Root` /
 * `ContextMenu.SubmenuRoot` don't render their own element, so these just forward
 * props and carry a `data-slot` where a DOM node exists. Unlike `DropdownMenu`,
 * the menu is opened by right-clicking (or long-pressing) the trigger area rather
 * than activating a button.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ContextMenu`. */
export type ContextMenuProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Root
>;

/**
 * `ContextMenu` — the root that groups every part of the menu. Renders no DOM
 * element of its own. Compose with {@link ContextMenuTrigger} and
 * {@link ContextMenuContent}.

 *
 * @example
 * <ContextMenu />
 */
export function ContextMenu(props: ContextMenuProps) {
  return <ContextMenuPrimitive.Root {...props} />;
}

/** Props accepted by `ContextMenuTrigger`. */
export type ContextMenuTriggerProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Trigger
>;

/**
 * `ContextMenuTrigger` — the area you right-click (or long-press on touch) to
 * open the menu. Renders a `<div>`; pass `render` to compose with your own
 * element (Base UI `render` composition). Right-click and long-press are handled by Base UI's
 * native `contextmenu` listener; Shift+F10 / Menu dispatch the same event from the focused trigger.

 *
 * @example
 * <ContextMenuTrigger />
 */
export function ContextMenuTrigger({
  onKeyDown,
  ...props
}: ContextMenuTriggerProps) {
  function handleKeyDown(
    event: Parameters<NonNullable<ContextMenuTriggerProps["onKeyDown"]>>[0],
  ) {
    onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const isContextMenuKey =
      event.key === "ContextMenu" ||
      event.key === "Menu" ||
      (event.key === "F10" && event.shiftKey);

    if (!isContextMenuKey) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 2,
      }),
    );
    event.preventDefault();
  }

  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

/** Props accepted by `ContextMenuGroup`. */
export type ContextMenuGroupProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Group
>;

/**
 * `ContextMenuGroup` — groups related items and associates them with a
 * {@link ContextMenuLabel}. Renders a `<div role="group">`.

 *
 * @example
 * <ContextMenuGroup />
 */
export function ContextMenuGroup(props: ContextMenuGroupProps) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  );
}

/** Props accepted by `ContextMenuSub`. */
export type ContextMenuSubProps = React.ComponentProps<
  typeof ContextMenuPrimitive.SubmenuRoot
>;

/**
 * `ContextMenuSub` — the root of a nested submenu. Renders no DOM element. Wrap
 * a {@link ContextMenuSubTrigger} and {@link ContextMenuSubContent}.

 *
 * @example
 * <ContextMenuSub />
 */
export function ContextMenuSub(props: ContextMenuSubProps) {
  return <ContextMenuPrimitive.SubmenuRoot {...props} />;
}

/** Props accepted by `ContextMenuRadioGroup`. */
export type ContextMenuRadioGroupProps = React.ComponentProps<
  typeof ContextMenuPrimitive.RadioGroup
>;

/**
 * `ContextMenuRadioGroup` — wraps {@link ContextMenuRadioItem}s for
 * single-select. Controlled via `value` / `onValueChange`.

 *
 * @example
 * <ContextMenuRadioGroup />
 */
export function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Content — Portal + Positioner + Popup, with enter/exit transitions driven by Base UI's
 * `data-[starting-style]` / `data-[ending-style]` + `data-[side]`. Exposes pass-through props for
 * Portal / Positioner, and anchors the positioner to the pointer position where the menu was opened.
 * ----------------------------------------------------------------------------------------------*/

const popupClassName =
  "z-(--z-overlay) max-h-[var(--available-height)] min-w-32 max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-overlay outline-none " +
  "transition-[transform,scale,opacity] duration-fast ease-standard " +
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 " +
  "data-[side=top]:translate-y-1 data-[side=bottom]:-translate-y-1 data-[side=left]:translate-x-1 data-[side=right]:-translate-x-1 " +
  "data-[starting-style]:translate-x-0 data-[starting-style]:translate-y-0 data-[ending-style]:translate-x-0 data-[ending-style]:translate-y-0";

/** Props accepted by `ContextMenuContent`. */
export interface ContextMenuContentProps extends React.ComponentProps<
  typeof ContextMenuPrimitive.Popup
> {
  /**
   * Which side of the anchor to render against. May flip to avoid collisions.
   * @default 'bottom'
   */
  side?: ContextMenuPrimitive.Positioner.Props["side"];
  /**
   * Alignment relative to the anchor along the chosen side.
   * @default 'start'
   */
  align?: ContextMenuPrimitive.Positioner.Props["align"];
  /**
   * Distance in pixels between the anchor and the popup.
   * @default 4
   */
  sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"];
  /**
   * Padding from the collision boundary so the popup never touches the viewport edge.
   * @default 8
   */
  collisionPadding?: ContextMenuPrimitive.Positioner.Props["collisionPadding"];
  /** Props forwarded to the underlying Base UI `Portal`.
   * @default undefined
   */
  portalProps?: Omit<ContextMenuPrimitive.Portal.Props, "children">;
  /** Props forwarded to the underlying Base UI `Positioner`.
   * @default undefined
   */
  positionerProps?: Omit<
    ContextMenuPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "collisionPadding" | "children"
  >;
}

/**
 * `ContextMenuContent` — the floating popup. Portals to `<body>`, positions
 * against the pointer where the menu opened, and applies enter/exit transitions.
 * Place items, labels, separators, and submenus inside it.

 *
 * @example
 * <ContextMenuContent />
 */
export function ContextMenuContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = FLOATING.sideOffsetAttached,
  collisionPadding = FLOATING.collisionPadding,
  portalProps,
  positionerProps,
  ...props
}: ContextMenuContentProps) {
  const themeScope = useInternalThemeScope();
  const { className: positionerClassName, ...positionerPropsRest } =
    positionerProps ?? {};

  return (
    <ContextMenuPrimitive.Portal {...portalProps}>
      <ContextMenuPrimitive.Positioner
        {...positionerPropsRest}
        data-slot="context-menu-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={mergeStateClassName<ContextMenuPrimitive.Positioner.State>(
          cn(themeScope, "z-(--z-overlay) outline-none"),
          positionerClassName,
        )}
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          className={cn(themeScope, popupClassName, className)}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Item — interactive row, with `variant="destructive"` (CVA) + `inset` spacing.
 * Highlighted state (keyboard nav / hover) is Base UI's `data-highlighted`.
 * ----------------------------------------------------------------------------------------------*/

export const contextMenuItemVariants = cva(
  "group/context-menu-item relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim) data-[inset]:ps-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  {
    variants: {
      variant: {
        default:
          "text-popover-foreground [&_svg]:text-muted-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[highlighted]:[&_svg]:text-accent-foreground",
        destructive:
          "text-destructive-text [&_svg]:text-destructive-text data-[highlighted]:bg-destructive-subtle data-[highlighted]:text-destructive-text",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** Props accepted by `ContextMenuItem`. */
export interface ContextMenuItemProps
  extends
    React.ComponentProps<typeof ContextMenuPrimitive.Item>,
    VariantProps<typeof contextMenuItemVariants> {
  /**
   * Adds inline-start padding so the label aligns with items that have a leading icon
   * or indicator.
   * @default false
   */
  inset?: boolean;
}

/**
 * `ContextMenuItem` — a selectable action. Use `variant="destructive"` for
 * delete/remove actions and `inset` to align with checkbox/radio rows. Closes
 * the menu on click by default.

 *
 * @example
 * <ContextMenuItem />
 */
export function ContextMenuItem({
  className,
  variant = "default",
  inset,
  ...props
}: ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      data-inset={inset ? "" : undefined}
      className={cn(contextMenuItemVariants({ variant }), className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Checkbox + Radio items — leading indicator slot, toggled/selected via
 * `data-checked`. Indicators render the check/dot only when active.
 * ----------------------------------------------------------------------------------------------*/

const choiceItemClassName =
  "group/context-menu-item relative flex items-center gap-2 rounded-sm py-1.5 pe-2 ps-8 text-base text-popover-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim) data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)";

/** Props accepted by `ContextMenuCheckboxItem`. */
export type ContextMenuCheckboxItemProps = React.ComponentProps<
  typeof ContextMenuPrimitive.CheckboxItem
>;

/**
 * `ContextMenuCheckboxItem` — a togglable item with a check indicator. Control
 * with `checked` / `onCheckedChange`. Stays open on click by default.

 *
 * @example
 * <ContextMenuCheckboxItem />
 */
export function ContextMenuCheckboxItem({
  className,
  children,
  ...props
}: ContextMenuCheckboxItemProps) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(choiceItemClassName, className)}
      {...props}
    >
      <span className="pointer-events-none absolute start-2 flex size-(--icon-default) items-center justify-center">
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <CheckIcon className="size-(--icon-default) text-foreground" />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

/** Props accepted by `ContextMenuRadioItem`. */
export type ContextMenuRadioItemProps = React.ComponentProps<
  typeof ContextMenuPrimitive.RadioItem
>;

/**
 * `ContextMenuRadioItem` — one option in a {@link ContextMenuRadioGroup}, with a
 * filled-dot indicator when selected.

 *
 * @example
 * <ContextMenuRadioItem />
 */
export function ContextMenuRadioItem({
  className,
  children,
  ...props
}: ContextMenuRadioItemProps) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(choiceItemClassName, className)}
      {...props}
    >
      <span className="pointer-events-none absolute start-2 flex size-(--icon-default) items-center justify-center">
        <ContextMenuPrimitive.RadioItemIndicator>
          <CircleIcon className="size-2 fill-current text-foreground" />
        </ContextMenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Label / Separator / Shortcut — non-interactive chrome.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ContextMenuLabel`. */
export interface ContextMenuLabelProps extends React.ComponentProps<
  typeof ContextMenuPrimitive.GroupLabel
> {
  /**
   * Indents the label to line up with inset items.
   * @default false
   */
  inset?: boolean;
}

/**
 * `ContextMenuLabel` — a non-interactive heading for a {@link ContextMenuGroup}
 * or {@link ContextMenuRadioGroup}. Renders Base UI's `GroupLabel` so it's
 * announced as the group's accessible name.

 *
 * @example
 * <ContextMenuLabel />
 */
export function ContextMenuLabel({
  className,
  inset,
  ...props
}: ContextMenuLabelProps) {
  return (
    <ContextMenuPrimitive.GroupLabel
      data-slot="context-menu-label"
      data-inset={inset ? "" : undefined}
      className={cn(
        "px-2 py-1.5 text-label-sm text-muted-foreground data-[inset]:ps-8",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ContextMenuSeparator`. */
export type ContextMenuSeparatorProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Separator
>;

/**
 * `ContextMenuSeparator` — a thin divider between item groups. Renders a
 * `<div role="separator">`.

 *
 * @example
 * <ContextMenuSeparator />
 */
export function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuSeparatorProps) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/** Props accepted by `ContextMenuShortcut`. */
export type ContextMenuShortcutProps = React.ComponentProps<"span">;

/**
 * `ContextMenuShortcut` — inline-end-aligned keyboard-shortcut hint inside an item
 * (e.g. `⌘K`). Purely visual; use the item's own keybinding for behavior.

 *
 * @example
 * <ContextMenuShortcut />
 */
export function ContextMenuShortcut({
  className,
  ...props
}: ContextMenuShortcutProps) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "ms-auto text-mono-label text-muted-foreground group-data-[highlighted]/context-menu-item:text-accent-foreground group-data-[variant=destructive]/context-menu-item:text-destructive-text group-data-[variant=destructive]/context-menu-item:group-data-[highlighted]/context-menu-item:text-destructive-text",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Submenu trigger + content.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ContextMenuSubTrigger`. */
export interface ContextMenuSubTriggerProps extends React.ComponentProps<
  typeof ContextMenuPrimitive.SubmenuTrigger
> {
  /**
   * Indents the trigger to align with inset items.
   * @default false
   */
  inset?: boolean;
}

/**
 * `ContextMenuSubTrigger` — the item that opens a nested submenu, with a
 * trailing chevron. Highlighted/open states use `data-highlighted` /
 * `data-popup-open`.

 *
 * @example
 * <ContextMenuSubTrigger />
 */
export function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuSubTriggerProps) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset ? "" : undefined}
      className={cn(
        "group/context-menu-item relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-base text-popover-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-(--opacity-dim) data-[inset]:ps-8 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[popup-open]:bg-accent data-[popup-open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-(--icon-default) data-[highlighted]:[&_svg]:text-accent-foreground data-[popup-open]:[&_svg]:text-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto rtl:rotate-180" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}

/** Props accepted by `ContextMenuSubContent`. */
export type ContextMenuSubContentProps = ContextMenuContentProps;

/**
 * `ContextMenuSubContent` — the nested popup opened by a
 * {@link ContextMenuSubTrigger}. Defaults to opening to the right of its parent.

 *
 * @example
 * <ContextMenuSubContent />
 */
export function ContextMenuSubContent({
  side = "right",
  align = "start",
  sideOffset = 0,
  ...props
}: ContextMenuSubContentProps) {
  return (
    <ContextMenuContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      {...props}
    />
  );
}
