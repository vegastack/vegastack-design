// @vegastack context-menu@0.7.2 sha256-YQOXIcOUi0JUHq/4O1kgEULmQCXq7FIbDSG8G3WqFfI=

"use client";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { FLOATING } from "@vegastack/design";
import {
  createMenuParts,
  FloatingSurface,
  type MenuPartCheckboxItemProps,
  type MenuPartContentProps,
  type MenuPartGroupProps,
  type MenuPartItemProps,
  type MenuPartLabelProps,
  type MenuPartRadioGroupProps,
  type MenuPartRadioItemProps,
  type MenuPartSeparatorProps,
  type MenuPartShortcutProps,
  type MenuPartSubTriggerProps,
} from "@/components/ui/floating-surface";

/* ------------------------------------------------------------------------------------------------
 * ContextMenu — the same menu as `DropdownMenu`, opened by right-click / long-press instead of a
 * button. Base UI's `ContextMenu` namespace re-exports `Menu`'s item, checkbox-item, radio-item,
 * group-label, submenu-trigger and separator parts verbatim, so the rows below are literally the
 * same components the dropdown uses — bound here to the `context-menu` slot prefix by
 * `createMenuParts` (audit B3-02). This file owns the root, the trigger, and the popup only.
 * ----------------------------------------------------------------------------------------------*/

const parts = createMenuParts("context-menu");

/** Props accepted by `ContextMenu`. */
export type ContextMenuProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Root
>;

/**
 * `ContextMenu` — the root that groups every part of the menu. Renders no DOM element of its own.
 * Compose with {@link ContextMenuTrigger} and {@link ContextMenuContent}.
 *
 * @example
 * <ContextMenu>
 *   <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
 *   <ContextMenuContent>
 *     <ContextMenuItem>Copy</ContextMenuItem>
 *   </ContextMenuContent>
 * </ContextMenu>
 */
export function ContextMenu(props: ContextMenuProps) {
  return <ContextMenuPrimitive.Root {...props} />;
}

/** Props accepted by `ContextMenuTrigger`. */
export type ContextMenuTriggerProps = React.ComponentProps<
  typeof ContextMenuPrimitive.Trigger
>;

/**
 * `ContextMenuTrigger` — the area you right-click (or long-press on touch) to open the menu.
 * Renders a `<div>`; pass `render` to compose with your own element. Right-click and long-press
 * are handled by Base UI's native `contextmenu` listener; Shift+F10 / Menu dispatch the same event
 * from the focused trigger.
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
export type ContextMenuGroupProps = MenuPartGroupProps;

/**
 * `ContextMenuGroup` — groups related items and associates them with a {@link ContextMenuLabel}.
 * Renders a `<div role="group">`.
 *
 * @example
 * <ContextMenuGroup />
 */
export const ContextMenuGroup = parts.Group;

/** Props accepted by `ContextMenuSub`. */
export type ContextMenuSubProps = React.ComponentProps<
  typeof ContextMenuPrimitive.SubmenuRoot
>;

/**
 * `ContextMenuSub` — the root of a nested submenu. Renders no DOM element. Wrap a
 * {@link ContextMenuSubTrigger} and {@link ContextMenuSubContent}.
 *
 * @example
 * <ContextMenuSub />
 */
export const ContextMenuSub = ContextMenuPrimitive.SubmenuRoot;

/** Props accepted by `ContextMenuRadioGroup`. */
export type ContextMenuRadioGroupProps = MenuPartRadioGroupProps;

/**
 * `ContextMenuRadioGroup` — wraps {@link ContextMenuRadioItem}s for single-select. Controlled via
 * `value` / `onValueChange`.
 *
 * @example
 * <ContextMenuRadioGroup />
 */
export const ContextMenuRadioGroup = parts.RadioGroup;

/** Props accepted by `ContextMenuContent`. */
export type ContextMenuContentProps = MenuPartContentProps;

/**
 * `ContextMenuContent` — the floating popup. Portals to `<body>`, positions against the pointer
 * where the menu opened, and applies the shared `menu` surface and its D11 enter/exit motion.
 *
 * @example
 * <ContextMenuContent />
 */
export function ContextMenuContent({
  side = "bottom",
  align = "start",
  sideOffset = FLOATING.sideOffsetAttached,
  collisionPadding = FLOATING.collisionPadding,
  portalProps,
  positionerProps,
  children,
  ...props
}: ContextMenuContentProps) {
  return (
    <FloatingSurface
      parts={{
        Portal: ContextMenuPrimitive.Portal,
        Positioner: ContextMenuPrimitive.Positioner,
        Popup: ContextMenuPrimitive.Popup,
      }}
      slot="context-menu"
      surface="menu"
      positioning={{ side, align, sideOffset, collisionPadding }}
      portalProps={portalProps}
      positionerProps={positionerProps}
      popupProps={props}
    >
      {children}
    </FloatingSurface>
  );
}

/** Props accepted by `ContextMenuItem`. */
export type ContextMenuItemProps = MenuPartItemProps;

/**
 * `ContextMenuItem` — a selectable action. Use `tone="destructive"` for delete/remove actions and
 * `inset` to align with checkbox/radio rows.
 *
 * @example
 * <ContextMenuItem tone="destructive">Delete</ContextMenuItem>
 */
export const ContextMenuItem = parts.Item;

/** Props accepted by `ContextMenuCheckboxItem`. */
export type ContextMenuCheckboxItemProps = MenuPartCheckboxItemProps;

/**
 * `ContextMenuCheckboxItem` — a togglable item with a check indicator.
 *
 * @example
 * <ContextMenuCheckboxItem checked>Show grid</ContextMenuCheckboxItem>
 */
export const ContextMenuCheckboxItem = parts.CheckboxItem;

/** Props accepted by `ContextMenuRadioItem`. */
export type ContextMenuRadioItemProps = MenuPartRadioItemProps;

/**
 * `ContextMenuRadioItem` — one option in a {@link ContextMenuRadioGroup}.
 *
 * @example
 * <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
 */
export const ContextMenuRadioItem = parts.RadioItem;

/** Props accepted by `ContextMenuLabel`. */
export type ContextMenuLabelProps = MenuPartLabelProps;

/**
 * `ContextMenuLabel` — a non-interactive heading for a {@link ContextMenuGroup}.
 *
 * @example
 * <ContextMenuLabel>View</ContextMenuLabel>
 */
export const ContextMenuLabel = parts.Label;

/** Props accepted by `ContextMenuSeparator`. */
export type ContextMenuSeparatorProps = MenuPartSeparatorProps;

/**
 * `ContextMenuSeparator` — a thin divider between item groups.
 *
 * @example
 * <ContextMenuSeparator />
 */
export const ContextMenuSeparator = parts.Separator;

/** Props accepted by `ContextMenuShortcut`. */
export type ContextMenuShortcutProps = MenuPartShortcutProps;

/**
 * `ContextMenuShortcut` — inline-end-aligned keyboard-shortcut hint inside an item.
 *
 * @example
 * <ContextMenuShortcut>⌘C</ContextMenuShortcut>
 */
export const ContextMenuShortcut = parts.Shortcut;

/** Props accepted by `ContextMenuSubTrigger`. */
export type ContextMenuSubTriggerProps = MenuPartSubTriggerProps;

/**
 * `ContextMenuSubTrigger` — the item that opens a nested submenu, with a trailing chevron.
 *
 * @example
 * <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
 */
export const ContextMenuSubTrigger = parts.SubTrigger;

/** Props accepted by `ContextMenuSubContent`. */
export type ContextMenuSubContentProps = ContextMenuContentProps;

/**
 * `ContextMenuSubContent` — the nested popup opened by a {@link ContextMenuSubTrigger}.
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
