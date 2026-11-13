// @vegastack chat-menu@0.78.1 sha256-BuxUIBTDfz9i+0UKjWOH6qBPSiuVFl+4xma1/CnMugQ=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Shortcut = { onSelect: () => void; disabled: boolean };

/** One menu level's number shortcuts, keyed by the key that picks them, and how to close the menu. */
type Shortcuts = {
  map: React.RefObject<Map<string, Shortcut>>;
  close: () => void;
};

const ShortcutsContext = React.createContext<Shortcuts | null>(null);

/**
 * Picks the item whose shortcut matches the pressed key, among the items of the level the focus is
 * in. A submenu is portaled, so the root popup ignores keys from outside its own element.
 */
function pickByShortcut(
  event: React.KeyboardEvent<HTMLElement>,
  shortcuts: Shortcuts,
) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (!event.currentTarget.contains(event.target as Node)) return;
  const hit = shortcuts.map.current.get(event.key);
  if (!hit || hit.disabled) return;
  event.preventDefault();
  hit.onSelect();
  shortcuts.close();
}

/** Props accepted by `ChatMenu`. */
export interface ChatMenuProps {
  /**
   * The element that opens the menu — usually a quiet text button ("Sonnet 5.5 · Medium"). A string
   * is wrapped in a plain button.
   */
  trigger: React.ReactElement | string;
  /** `ChatMenuItem`, `ChatMenuSub` and `ChatMenuSeparator` parts. */
  children: React.ReactNode;
  /** Which edge of the trigger the menu lines up with. @default "start" */
  align?: "start" | "end";
  /** Which side of the trigger it opens on (a composer's menus open upward). @default "bottom" */
  side?: "top" | "bottom";
  /** Controlled open state. @default undefined */
  open?: boolean;
  /** Called when the menu opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** Extra classes on the popup. @default undefined */
  className?: string;
}

/**
 * A menu with the chat's density — one column, tight rows, no empty detail pane — for picking a
 * model, an effort level, a scope. An item can carry a number shortcut: while the menu is open,
 * pressing that key picks it. → opens a submenu (Base UI). The selected item's ✓ is primary
 * (COL-25) and shares the right slot with the shortcut.
 *
 * @example
 * <ChatMenu trigger="Sonnet 5.5" side="top" align="end">
 *   <ChatMenuItem selected shortcut="1" onSelect={() => pick("sonnet")}>Sonnet 5.5</ChatMenuItem>
 *   <ChatMenuItem shortcut="2" onSelect={() => pick("opus")}>Opus 5.5</ChatMenuItem>
 *   <ChatMenuSeparator />
 *   <ChatMenuSub label="Effort" value="Medium">
 *     <ChatMenuItem hint="Recommended" selected onSelect={() => setEffort("medium")}>Medium</ChatMenuItem>
 *   </ChatMenuSub>
 * </ChatMenu>
 */
function ChatMenu({
  trigger,
  children,
  align = "start",
  side = "bottom",
  open: openProp,
  onOpenChange,
  className,
}: ChatMenuProps) {
  const [ownOpen, setOwnOpen] = React.useState(false);
  const open = openProp ?? ownOpen;
  const map = React.useRef(new Map<string, Shortcut>());
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const shortcuts: Shortcuts = { map, close: () => setOpen(false) };
  return (
    <ShortcutsContext.Provider value={shortcuts}>
      <DropdownMenu open={open} onOpenChange={(next) => setOpen(next)}>
        <DropdownMenuTrigger
          data-slot="chat-menu-trigger"
          render={
            typeof trigger === "string" ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-md px-2 text-xs font-normal text-muted-foreground"
              >
                {trigger}
              </Button>
            ) : (
              trigger
            )
          }
        />
        <DropdownMenuContent
          data-slot="chat-menu-content"
          align={align}
          side={side}
          className={cn("min-w-56", className)}
          onKeyDown={(event) => pickByShortcut(event, shortcuts)}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </ShortcutsContext.Provider>
  );
}

/** Props accepted by `ChatMenuItem`. */
export interface ChatMenuItemProps {
  /** The item's words. */
  children: React.ReactNode;
  /** A quiet second line, or a "Recommended" note beside the words. @default undefined */
  hint?: React.ReactNode;
  /** Draws the ✓ in the right slot. @default false */
  selected?: boolean;
  /** One key (usually a digit) that picks this item while the menu is open. @default undefined */
  shortcut?: string;
  /** Not available right now; it stays in the list. @default false */
  disabled?: boolean;
  /** Muted words — an option this person can't use ("Off · ask an admin" as the hint). @default false */
  muted?: boolean;
  /**
   * A one-line purpose shown as a tooltip beside the row on hover or focus ("Everyday work"),
   * never as a pane; screen readers hear it as the item's description.
   * @default undefined
   */
  description?: string;
  /** Called when the item is picked by pointer, Enter or its shortcut. @default undefined */
  onSelect?: () => void;
}

/**
 * One row of a `ChatMenu`: the words, an optional hint, and one right slot holding the ✓
 * (primary) on the selected row or its number shortcut on the others.
 *
 * @example
 * <ChatMenuItem selected shortcut="1" onSelect={pickSonnet}>Sonnet 5.5</ChatMenuItem>
 */
function ChatMenuItem({
  children,
  hint,
  selected = false,
  shortcut,
  disabled = false,
  muted = false,
  description,
  onSelect,
}: ChatMenuItemProps) {
  const shortcuts = React.useContext(ShortcutsContext);
  React.useEffect(() => {
    if (!shortcuts || !shortcut || !onSelect) return;
    const map = shortcuts.map.current;
    map.set(shortcut, { onSelect, disabled });
    return () => {
      if (map.get(shortcut)?.onSelect === onSelect) map.delete(shortcut);
    };
  }, [shortcuts, shortcut, onSelect, disabled]);
  const item = (
    <DropdownMenuItem
      data-slot="chat-menu-item"
      data-selected={selected ? "" : undefined}
      data-muted={muted ? "" : undefined}
      disabled={disabled}
      aria-keyshortcuts={shortcut}
      aria-description={description}
      onClick={onSelect}
      className="min-h-8 gap-3"
    >
      <span
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          muted && "text-muted-foreground",
        )}
      >
        <span className="min-w-0 truncate">{children}</span>
        {hint != null ? (
          <span
            data-slot="chat-menu-item-hint"
            className="min-w-0 text-xs text-muted-foreground"
          >
            {hint}
          </span>
        ) : null}
      </span>
      {selected || shortcut ? (
        <span
          data-slot="chat-menu-item-end"
          className="ms-auto flex shrink-0 items-center gap-2"
        >
          {selected ? (
            <Check
              role="img"
              aria-label="Selected"
              data-icon-tone=""
              strokeWidth={1.5}
              className="text-primary"
            />
          ) : null}
          {/* The ✓ takes the slot: a selected row shows no number (its key still works). */}
          {shortcut && !selected ? (
            <span
              aria-hidden="true"
              className="w-3 text-center text-xs text-muted-foreground tabular-nums"
            >
              {shortcut}
            </span>
          ) : null}
        </span>
      ) : null}
    </DropdownMenuItem>
  );
  if (!description) return item;
  return (
    <Tooltip>
      <TooltipTrigger render={item} />
      <TooltipContent side="left">{description}</TooltipContent>
    </Tooltip>
  );
}

/** Props accepted by `ChatMenuSub`. */
export interface ChatMenuSubProps {
  /** The row's words ("Effort"). */
  label: React.ReactNode;
  /** The current choice, muted before the chevron ("Medium"). @default undefined */
  value?: React.ReactNode;
  /** A one-line explainer above the submenu's items, muted and not focusable. @default undefined */
  note?: React.ReactNode;
  /** Controlled open state (a shortcut that opens straight into the submenu). @default undefined */
  open?: boolean;
  /** Called when the submenu opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** The submenu's items. */
  children: React.ReactNode;
}

/**
 * A row that opens a submenu on hover, Enter or → — "Effort  Medium ›".
 *
 * @example
 * <ChatMenuSub label="Effort" value="Medium">
 *   <ChatMenuItem selected onSelect={pickMedium}>Medium</ChatMenuItem>
 * </ChatMenuSub>
 */
function ChatMenuSub({
  label,
  value,
  note,
  open,
  onOpenChange,
  children,
}: ChatMenuSubProps) {
  const parent = React.useContext(ShortcutsContext);
  const map = React.useRef(new Map<string, Shortcut>());
  const shortcuts: Shortcuts = {
    map,
    close: parent?.close ?? (() => {}),
  };
  return (
    <DropdownMenuSub
      open={open}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
    >
      <DropdownMenuSubTrigger
        data-slot="chat-menu-sub-trigger"
        className="min-h-8 gap-3"
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {value != null ? (
          <span
            data-slot="chat-menu-sub-value"
            className="shrink-0 text-xs text-muted-foreground"
          >
            {value}
          </span>
        ) : null}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        data-slot="chat-menu-sub-content"
        className="min-w-56"
        onKeyDown={(event) => pickByShortcut(event, shortcuts)}
      >
        {note != null ? (
          <p
            data-slot="chat-menu-sub-note"
            className="max-w-64 px-2 pt-1 pb-1.5 text-xs text-muted-foreground"
          >
            {note}
          </p>
        ) : null}
        <ShortcutsContext.Provider value={shortcuts}>
          {children}
        </ShortcutsContext.Provider>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * A hairline between groups of a `ChatMenu`.
 *
 * @example
 * <ChatMenuSeparator />
 */
function ChatMenuSeparator() {
  return <DropdownMenuSeparator data-slot="chat-menu-separator" />;
}

export { ChatMenu, ChatMenuItem, ChatMenuSub, ChatMenuSeparator };
