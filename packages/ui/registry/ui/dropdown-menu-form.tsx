// @vegastack dropdown-menu-form@0.27.0 sha256-v1YUhvlwrvRvzuGMk8xaLbNGtGagB7JUEAo7yXkaJHE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/* ---
The parts a menu needs to hold a small form — a settings flyout that opens from a column header, a
"+" or a context click. They compose `DropdownMenu`, `Input` and `Switch` and patch none of them:

- `DropdownMenuSwitchItem` — a row that switches, the whole row being the item.
- `DropdownMenuAtPoint` — a menu that opens beside a point, where no trigger exists.
- `DropdownMenuInput` and `stopMenuTyping` — typing in a field inside a menu without the menu's
  arrow-key and type-ahead handling taking the keys.
- `DropdownMenuIdentity` — who or what the menu is about, at its top: an avatar or logo, a name and
  a quieter line (an account menu's person and email). It gives the menu its 224px minimum width.
- `DropdownMenuNote` — a quiet centred line at the foot of a menu (a credit, a version).
--- */

/** Where a menu opens: viewport pixels. */
export interface DropdownMenuPoint {
  x: number;
  y: number;
}

/**
 * Typing inside a menu must not reach its arrow-key and type-ahead handling: the key stops here,
 * except Escape (closes the menu) and Tab (moves on). Put it in the `onKeyDown` of a text field,
 * a textarea or a number field inside a `DropdownMenuContent`.
 *
 * @param passArrows - also let ArrowUp and ArrowDown through, so the keyboard can leave a
 * field that is the menu's first row for the rest of it.
 */
export function stopMenuTyping(
  event: React.KeyboardEvent,
  passArrows = false,
): void {
  if (event.key === "Escape" || event.key === "Tab") return;
  if (passArrows && (event.key === "ArrowDown" || event.key === "ArrowUp"))
    return;
  event.stopPropagation();
}

/** Props accepted by `DropdownMenuInput`. */
export interface DropdownMenuInputProps extends React.ComponentProps<
  typeof Input
> {
  /**
   * Let ArrowUp and ArrowDown reach the menu, so the keyboard moves on to the rows around the
   * field (a name field at the top of a settings menu).
   * @default false
   */
  passArrows?: boolean;
}

/**
 * `DropdownMenuInput` — an `Input` for use inside a menu: its keys stay its own (typing,
 * arrows, Home and End), apart from Escape and Tab, and with `passArrows` the vertical arrows.
 *
 * @example
 * <DropdownMenuInput passArrows aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} />
 */
export function DropdownMenuInput({
  passArrows = false,
  onKeyDown,
  ...props
}: DropdownMenuInputProps) {
  return (
    <Input
      data-slot="dropdown-menu-input"
      onKeyDown={(event) => {
        stopMenuTyping(event, passArrows);
        onKeyDown?.(event);
      }}
      {...props}
    />
  );
}

/** Props accepted by `DropdownMenuSwitchItem`. */
export interface DropdownMenuSwitchItemProps extends Omit<
  React.ComponentProps<typeof DropdownMenuCheckboxItem>,
  "children" | "label"
> {
  /** The row's name. */
  label: React.ReactNode;
  /**
   * A muted line under the name.
   * @default undefined
   */
  hint?: React.ReactNode;
}

/**
 * `DropdownMenuSwitchItem` — a menu row that switches: the whole row is the checkbox item (a
 * click anywhere on it toggles, and it keeps a menu item's focus and keys), and the `Switch`
 * only draws its state. An optional `hint` sits under the label.
 *
 * @example
 * <DropdownMenuSwitchItem label="Required" hint="A row can't be saved without it." checked={required} onCheckedChange={setRequired} />
 */
export function DropdownMenuSwitchItem({
  label,
  hint,
  checked,
  className,
  ...props
}: DropdownMenuSwitchItemProps) {
  return (
    <DropdownMenuCheckboxItem
      data-slot="dropdown-menu-switch-item"
      checked={checked}
      className={cn(
        "items-start pe-1.5 [&_[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span>{label}</span>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {/* Inert: the row is the control, so the switch is neither focusable nor read. */}
      <span inert aria-hidden className="mt-0.5 flex shrink-0">
        <Switch size="sm" checked={checked} className="pointer-events-none" />
      </span>
    </DropdownMenuCheckboxItem>
  );
}

/** Props accepted by `DropdownMenuAtPoint`. */
export interface DropdownMenuAtPointProps {
  /** Where the menu opens, or `null` while it is closed. */
  point: DropdownMenuPoint | null;
  /** The menu asked to close (Escape, a press outside, a choice). */
  onClose: () => void;
  /** The menu's content: items, or a form. */
  children: React.ReactNode;
  /**
   * Which edge of the point the menu lines up with.
   * @default "start"
   */
  align?: "start" | "center" | "end";
  /**
   * The content's extra classes.
   * @default undefined
   */
  className?: string;
}

/**
 * `DropdownMenuAtPoint` — a menu that opens beside a point in the viewport, for a request that
 * has no trigger to hang from: a "+" at the end of a header, an item in another menu, a context
 * click. The point is where it opens; it stays there while the menu closes.
 *
 * @example
 * <DropdownMenuAtPoint point={point} onClose={() => setPoint(null)}>
 *   <DropdownMenuItem>Insert left</DropdownMenuItem>
 * </DropdownMenuAtPoint>
 */
export function DropdownMenuAtPoint({
  point,
  onClose,
  children,
  align = "start",
  className,
}: DropdownMenuAtPointProps) {
  // The last point stays while the menu animates out, so it does not slide to the corner.
  const last = React.useRef<DropdownMenuPoint>({ x: 0, y: 0 });
  if (point) last.current = point;
  const { x, y } = last.current;
  return (
    <DropdownMenu
      open={point !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
    >
      <DropdownMenuTrigger
        nativeButton={false}
        render={<span />}
        aria-hidden
        tabIndex={-1}
        data-slot="dropdown-menu-point"
        className="pointer-events-none fixed top-(--anchor-y) left-(--anchor-x) size-0"
        style={
          {
            "--anchor-x": `${x}px`,
            "--anchor-y": `${y}px`,
          } as React.CSSProperties
        }
      />
      <DropdownMenuContent align={align} className={className}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Props accepted by `DropdownMenuIdentity`. */
export interface DropdownMenuIdentityProps extends Omit<
  React.ComponentProps<"div">,
  "title" | "children"
> {
  /** The avatar or logo. @default undefined */
  media?: React.ReactNode;
  /** The name — truncated, with its full text as a tooltip when it is a string. */
  title: React.ReactNode;
  /** A quieter line under the name (an email, a role). @default undefined */
  description?: React.ReactNode;
}

/**
 * `DropdownMenuIdentity` — the header row of a menu about one person or thing: `media`, then the
 * `title` over a quieter `description`, both truncated, read as plain text (not an item). Put it
 * first in the menu; it sets the menu's minimum width (224px) so names have room.
 *
 * @example
 * <DropdownMenuIdentity media={<Avatar />} title="Neha Kapoor" description="neha@example.com" />
 */
export function DropdownMenuIdentity({
  media,
  title,
  description,
  className,
  ...props
}: DropdownMenuIdentityProps) {
  return (
    // A `group` is one of the children a `menu` may hold; plain text there is not.
    <div
      role="group"
      data-slot="dropdown-menu-identity"
      className={cn(
        "flex min-w-52 items-center gap-2 px-1.5 py-1 text-sm text-foreground",
        className,
      )}
      {...props}
    >
      {media}
      <span className="grid min-w-0 flex-1 text-start leading-tight">
        <span
          title={typeof title === "string" ? title : undefined}
          className="truncate font-medium"
        >
          {title}
        </span>
        {description != null ? (
          <span
            title={typeof description === "string" ? description : undefined}
            className="truncate text-xs text-muted-foreground"
          >
            {description}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** Props accepted by `DropdownMenuNote`. */
export interface DropdownMenuNoteProps extends React.ComponentProps<"div"> {
  /**
   * A link at the end of the line ("VegaStack" in a credit): a muted, unstyled link that is a
   * `menuitem`, the only interactive child a menu may hold. Opens in a new tab.
   * @default undefined
   */
  link?: { href: string; label: string };
}

/**
 * `DropdownMenuNote` — a quiet, centred line at the foot of a menu: a credit or a version. Its
 * text is not an item; an optional `link` ends it.
 *
 * @example
 * <DropdownMenuNote link={{ href: "https://vegastack.com", label: "VegaStack" }}>
 *   Designed and developed by
 * </DropdownMenuNote>
 */
export function DropdownMenuNote({
  link,
  className,
  children,
  ...props
}: DropdownMenuNoteProps) {
  return (
    // A `group`, which a `menu` may hold (bare text or a plain link may not).
    <div
      role="group"
      data-slot="dropdown-menu-note"
      className={cn(
        "px-1.5 py-1 text-center text-xs leading-snug text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {link ? (
        <>
          {" "}
          <a
            role="menuitem"
            href={link.href}
            target="_blank"
            rel="noopener"
            data-slot="dropdown-menu-note-link"
            className="text-muted-foreground no-underline hover:text-foreground"
          >
            {link.label}
          </a>
        </>
      ) : null}
    </div>
  );
}
