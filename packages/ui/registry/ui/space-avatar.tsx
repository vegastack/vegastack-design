// @vegastack space-avatar@0.23.123 sha256-iST+Z8WTWEi/GAQFOkK0fLXmxiBngrC4U/I73IctcDo=

import * as React from "react";
import { Layers, LockIcon, UserLock } from "lucide-react";
import { cn } from "@vegastack/design";
import { Avatar, AvatarFallback, type AvatarHue } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------------------------------------
 * SpaceAvatar — the ONE way a space (a workspace area that holds items, such as General, Sales or
 * a person's own "My space") is drawn: a rounded-square tile, the space's icon or its first
 * initial, on the space's hue. A private space wears a small lock at its corner; a personal space
 * (one person's own My space) is a person-with-lock glyph on the muted tile. SpaceOption is the
 * row that lists a space in pickers and menus, the space twin of PersonOption.
 *
 * `SpaceIcon` (lucide `Layers`) is the one glyph for the CONCEPT of a space — "Move to…", a space
 * picker's empty state, a placeholder chip. `Compass` is only "Browse spaces"; a folder never means
 * a space (it is a project).
 * ----------------------------------------------------------------------------------------------*/

/**
 * `SpaceIcon` — the generic glyph for "a space" (lucide `Layers`). Use it wherever the concept is
 * shown without a particular space: "Move to…", picker empty states, placeholders.
 *
 * @example <SpaceIcon aria-hidden className="size-4" />
 */
export const SpaceIcon = Layers;

/**
 * Which kind of space holds a record the viewer can open but whose space they cannot see: someone
 * else's My space (named by its owner), or a private team space (never named). It carries no name
 * or id of the space itself.
 */
export type SpaceHint =
  { kind: "personal"; ownerName: string } | { kind: "private" };

/**
 * `spaceHintLabel` — the words for a hidden space: "Priya's My space", or "Private space".
 *
 * @example spaceHintLabel({ kind: "personal", ownerName: "Priya" }); // "Priya's My space"
 */
export function spaceHintLabel(hint: SpaceHint): string {
  return hint.kind === "personal"
    ? `${hint.ownerName}'s My space`
    : "Private space";
}

/**
 * `SpaceHintIcon` — the glyph for a hidden space: a person-with-lock for someone's My space, a
 * lock for a private space.
 *
 * @example <SpaceHintIcon hint={hint} aria-hidden className="size-3.5" />
 */
export function SpaceHintIcon({
  hint,
  ...props
}: { hint: SpaceHint } & React.ComponentProps<typeof LockIcon>) {
  return hint.kind === "personal" ? (
    <UserLock {...props} />
  ) : (
    <LockIcon {...props} />
  );
}

/** A space shown by `SpaceAvatar` and `SpaceOption`. */
export interface Space {
  /** The space's name; its first letter is the tile when there is no icon. */
  name: string;
  /** An icon drawn on the tile in place of the initial — usually a lucide icon. @default undefined */
  icon?: React.ReactNode;
  /** The space's colour — one of the ten tag hues; none is the muted tile. @default undefined */
  hue?: AvatarHue | null;
  /**
   * Who can open it. `open` — anyone in the workspace; `private` — members only (a lock at the
   * corner); `personal` — one person's own My space (a person-with-lock glyph is the tile).
   */
  access: "open" | "private" | "personal";
}

/** Props for `SpaceAvatar`. */
export interface SpaceAvatarProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The space. */
  space: Space;
  /**
   * Tile size: 16, 20, 24, 32 or 40px. `2xs` (16px) sits in a `SidebarMenuButton` row's icon slot,
   * so space rows line up with the 16px nav icons around them; it draws no corner lock.
   * @default "sm"
   */
  size?: "2xs" | "xs" | "sm" | "default" | "lg";
  /** Draw the corner lock on a `private` space. Off inside a picker trigger or a dense row. @default true */
  showLock?: boolean;
}

const ICON_SIZE = {
  "2xs": "[&_svg]:size-2.5",
  xs: "[&_svg]:size-3",
  sm: "[&_svg]:size-3.5",
  default: "[&_svg]:size-4",
  lg: "[&_svg]:size-5",
} as const;

/** The first letter of the name, by code point, uppercased. */
function spaceInitial(name: string): string {
  return (Array.from(name.trim())[0] ?? "").toUpperCase();
}

/**
 * `SpaceAvatar` — a space's tile: its icon or first initial on its hue, a corner lock when it is
 * private, and the lock itself for a personal space. Decorative by default (the space's name sits
 * beside it); pass `aria-label` to make it an image of its own.
 *
 * @example <SpaceAvatar space={{ name: "Sales", hue: "green", access: "private" }} />
 */
export function SpaceAvatar({
  space,
  size = "sm",
  showLock = true,
  className,
  ...props
}: SpaceAvatarProps) {
  const tiny = size === "2xs" || size === "xs";
  const personal = space.access === "personal";
  const labelled = props["aria-label"] != null;
  return (
    <span
      data-slot="space-avatar"
      data-access={space.access}
      data-size={size}
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn("relative inline-flex shrink-0", className)}
      {...props}
    >
      <Avatar
        size={tiny ? "sm" : size}
        className={cn(
          "rounded-md after:rounded-md",
          size === "xs" && "data-[size=sm]:size-5",
          size === "2xs" && "rounded-sm after:rounded-sm data-[size=sm]:size-4",
        )}
      >
        <AvatarFallback
          hue={personal ? undefined : (space.hue ?? undefined)}
          className={cn(
            "rounded-md font-medium",
            size === "lg" && "text-sm",
            size === "2xs" && "rounded-sm text-xs leading-none",
            ICON_SIZE[size],
          )}
        >
          {personal ? <UserLock /> : (space.icon ?? spaceInitial(space.name))}
        </AvatarFallback>
      </Avatar>
      {space.access === "private" && showLock && size !== "2xs" ? (
        <span
          data-slot="space-avatar-lock"
          className={cn(
            "absolute -end-1 -bottom-1 flex items-center justify-center rounded-full bg-background text-muted-foreground",
            tiny || size === "sm"
              ? "size-3 [&_svg]:size-2"
              : "size-4 [&_svg]:size-2.5",
          )}
        >
          <LockIcon />
        </span>
      ) : null}
    </span>
  );
}

/** Props for `SpaceOption`. */
export interface SpaceOptionProps {
  /** The space's name. */
  name: React.ReactNode;
  /** The smaller, muted second line — such as "Private · 8 members". @default undefined */
  secondary?: React.ReactNode;
  /** A leading `SpaceAvatar`. @default undefined */
  avatar?: React.ReactNode;
  /** A status beside the name, such as "Joined" — a string is a small muted outline badge. @default undefined */
  badge?: React.ReactNode;
}

/**
 * `SpaceOption` — the standard space row wherever spaces are listed (a `SearchableSelect`
 * `renderItem`, a `DropdownMenuItem`, a "Move to…" list): the tile, then the name with a smaller
 * muted line under it — the space twin of `PersonOption`.
 *
 * @example
 * <SpaceOption
 *   name="Sales"
 *   secondary="Private · 8 members"
 *   avatar={<SpaceAvatar space={{ name: "Sales", hue: "green", access: "private" }} />}
 * />
 */
export function SpaceOption({
  name,
  secondary,
  avatar,
  badge,
}: SpaceOptionProps) {
  return (
    <span data-slot="space-option" className="flex min-w-0 items-center gap-2">
      {avatar}
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{name}</span>
          {badge == null || badge === false ? null : typeof badge ===
            "string" ? (
            <Badge
              variant="outline"
              data-slot="space-option-badge"
              className="shrink-0 text-xs font-normal text-muted-foreground"
            >
              {badge}
            </Badge>
          ) : (
            badge
          )}
        </span>
        {secondary != null ? (
          <span className="truncate text-xs text-muted-foreground">
            {secondary}
          </span>
        ) : null}
      </span>
    </span>
  );
}
