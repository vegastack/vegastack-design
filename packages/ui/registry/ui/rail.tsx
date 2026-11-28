// @vegastack rail@0.143.1 sha256-wmzCLVZLSAMl6o684MQmMvWBoGT8jIdSn7Pa3B9mSJ4=

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@vegastack/design";
import { RailIcon } from "@/components/ui/rail-client";

export { RailIcon, lazyAnimatedIcon } from "@/components/ui/rail-client";

/* ---
WHY THIS SHAPE — the module rail (Layout v2, D2).

The rail holds the app's modules and nothing else: about seven items, each an 18px icon on a
36×28 tile with a short label under it, and a bottom group (`RailBottom`) for Settings. Its two
fixed ends (LAY-26) are the workspace's logo tile at the top (`RailTop` + `RailTile`) and the
person's avatar under Settings (`RailTile shape="avatar"`). Search and Help live in the global
bar, and there is no "More" menu: a rail that needs one
has too many modules, which is the app's choice to fix, not the rail's. It renders on the server;
only an item's animated icon (`RailIcon`) is a client leaf.

Every item is the rail's full width, so its tile and icon sit on the rail's centre line; the
global bar's first control is placed on the same line (`global-bar`).
--- */

/** A count as the badge shows it: nothing for 0 or empty, "99+" past 99. */
export function railBadgeText(
  badge: number | string | undefined,
): string | undefined {
  if (badge === undefined || badge === 0 || badge === "") return undefined;
  return typeof badge === "number" && badge > 99 ? "99+" : String(badge);
}

/** Props accepted by `RailBadge`. */
export interface RailBadgeProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  /** The count; 0 or empty renders nothing, past 99 reads "99+". */
  count: number | string | undefined;
}

/**
 * `RailBadge` — the compact count on a navigation icon: a 14px chip of 10px tabular numerals (the
 * one TYP-18 exception, operator 17-11-2026) on the icon's top-right corner that overlaps the icon by a few pixels only, so the icon keeps its shape even at "99+".
 * Place it inside a `relative` box the size of the icon. The rail's items and the phone bottom
 * bar use it; the item's accessible name carries the count, so the chip is hidden from readers.
 *
 * @example
 * <span className="relative size-4.5"><Inbox /><RailBadge count={120} /></span>
 */
export function RailBadge({ count, className, ...props }: RailBadgeProps) {
  const text = railBadgeText(count);
  if (!text) return null;
  return (
    <span
      data-slot="rail-badge"
      aria-hidden="true"
      className={cn(
        // Anchored at the icon's top-right: its start edge sits 4px inside the icon, its middle on
        // the icon's top edge, so it bites only the corner.
        "pointer-events-none absolute -top-1.5 start-[calc(100%-0.25rem)] grid h-3.5 min-w-3.5 place-items-center rounded-chip bg-foreground px-0.75 text-[0.625rem] leading-none font-semibold text-background tabular-nums shadow-[0_0_0_1.5px_var(--sidebar)]",
        className,
      )}
      {...props}
    >
      {text}
    </span>
  );
}

/** Props accepted by `Rail`. */
export interface RailProps extends React.ComponentProps<"nav"> {
  /** The navigation landmark's name. @default 'Modules' */
  label?: string;
}

/**
 * `Rail` — the column of modules down the app's start edge: `RailItem`s, then a `RailBottom`
 * group pinned to the foot. It scrolls by itself when a short window cannot fit every item.
 *
 * @example
 * <Rail>
 *   <RailItem icon={<Home />} label="Home" href="/" active />
 *   <RailBottom><RailItem icon={<Settings2 />} label="Settings" href="/settings" /></RailBottom>
 * </Rail>
 */
export function Rail({ label = "Modules", className, ...props }: RailProps) {
  return (
    <nav
      data-slot="rail"
      data-shell-region="rail"
      tabIndex={-1}
      aria-label={label}
      className={cn(
        "relative scroll-fade-y flex min-h-0 w-full flex-1 flex-col items-stretch gap-0.5 overflow-y-auto pt-2 pb-2.5 outline-none [scrollbar-width:none]",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `RailItem`. */
export interface RailItemProps extends Omit<
  React.ComponentProps<"a">,
  "children"
> {
  /** The module's icon, 18px. */
  icon: React.ReactNode;
  /**
   * The same icon, animated: an element of a `lazyAnimatedIcon`. The static `icon` paints first;
   * this loads once the browser is idle and plays on hover and when the item becomes current.
   * @default undefined
   */
  animatedIcon?: React.ReactElement;
  /** The short label under the icon. */
  label: string;
  /** A count on the icon (`RailBadge`: "99+" past 99). @default undefined */
  badge?: number | string;
  /**
   * A dot on the icon for something new that has no count. Pass the words it means ("new
   * updates"); they are read after the label.
   * @default undefined
   */
  dot?: string;
  /** Whether this is the current module. @default false */
  active?: boolean;
  /** The app's own link or button element (`<Link href="/tasks" />`); its props win. @default undefined */
  render?: React.ReactElement;
}

type ElementProps = Record<string, unknown> & {
  className?: string;
  children?: React.ReactNode;
};

/**
 * `RailItem` — one module: its icon on a 36×28 tile with the label under it. The current
 * module's tile is filled; hovering it while the shell's column is folded peeks the column.
 *
 * @example
 * <RailItem icon={<Inbox />} label="Inbox" badge={17} render={<Link href="/inbox" />} active />
 */
export function RailItem({
  icon,
  animatedIcon,
  label,
  badge,
  dot,
  active = false,
  render,
  href,
  className,
  "aria-label": ariaLabel,
  ...props
}: RailItemProps) {
  const count = railBadgeText(badge);
  // An explicit name wins; else the label carries the count or the dot's meaning.
  const own = (render?.props ?? {}) as { "aria-label"?: string };
  // An explicit name wins, on the item or on its `render` element.
  const name =
    ariaLabel ??
    own["aria-label"] ??
    (count ? `${label}, ${count}` : dot ? `${label} (${dot})` : undefined);
  const element = render ?? (href ? <a href={href} /> : <ButtonPrimitive />);
  const ownProps = element.props as ElementProps;
  return React.cloneElement(element, {
    ...props,
    ...ownProps,
    "data-slot": "rail-item",
    "data-active": active ? "" : undefined,
    "aria-current": active ? "page" : undefined,
    "aria-label": name,
    className: cn(
      "group/rail-item flex w-full flex-none flex-col items-center gap-0.5 pt-1 pb-1.5 text-xs font-medium text-muted-foreground no-underline outline-none data-active:text-nav-selected-foreground",
      className,
      ownProps.className,
    ),
    children: (
      <>
        <span
          aria-hidden="true"
          className="grid h-7 w-9 place-items-center rounded-item transition-colors duration-instant group-hover/rail-item:bg-state-hover group-hover/rail-item:text-foreground group-focus-visible/rail-item:bg-state-hover group-data-active/rail-item:bg-nav-selected"
        >
          <span className="relative grid size-4.5 place-items-center [&_svg:not([class*='size-'])]:size-4.5">
            {animatedIcon ? (
              <RailIcon icon={icon} animated={animatedIcon} />
            ) : (
              icon
            )}
            {count ? (
              <RailBadge count={count} />
            ) : dot ? (
              <span
                data-slot="rail-dot"
                className="absolute -top-0.5 -end-0.5 size-2 rounded-chip bg-unread shadow-[0_0_0_2px_var(--sidebar)]"
              />
            ) : null}
          </span>
        </span>
        <span className="max-w-full truncate px-1">{label}</span>
      </>
    ),
  } as ElementProps);
}

/**
 * `RailTop` — the rail's head (LAY-26): the workspace's 36px logo tile above the modules, with a
 * short rule under it. The tile is the app's own workspace menu trigger; the rail itself still
 * holds modules only, with the workspace and the account as its two fixed ends.
 *
 * @example
 * <Rail>
 *   <RailTop><WorkspaceMenu trigger={<RailTile label="Workspace: Acme">A</RailTile>} /></RailTop>
 *   <RailItem icon={<Home />} label="Home" href="/" active />
 * </Rail>
 */
export function RailTop({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rail-top"
      className={cn(
        "flex flex-none flex-col items-center gap-2 pt-0.5 pb-1.5",
        className,
      )}
      {...props}
    >
      {children}
      <span aria-hidden="true" className="h-px w-7 bg-border" />
    </div>
  );
}

/** Props accepted by `RailTile`. */
export interface RailTileProps extends Omit<
  React.ComponentProps<"button">,
  "children"
> {
  /** The button's accessible name ("Workspace: Acme — switch workspace"). */
  label: string;
  /** The tile's face: a logo image or the workspace's initial. */
  children: React.ReactNode;
  /**
   * `tile`: the workspace's 36px logo tile in `RailTop`. `avatar`: the person's round 32px avatar
   * under Settings in `RailBottom`, which opens the account menu.
   * @default 'tile'
   */
  shape?: "tile" | "avatar";
  /** The app's own element; its props win. @default undefined */
  render?: React.ReactElement;
}

/**
 * `RailTile` — a button at the rail's ends: the workspace's 36px logo tile in `RailTop`, or the
 * person's round 32px avatar under Settings (`shape="avatar"`). Pass a logo `<img>`, an initial
 * or an avatar as its children; a ring in the canvas, then a hairline, marks it as pressable.
 *
 * @example
 * <RailTile label="Workspace: Acme — switch workspace"><img src={logo} alt="" /></RailTile>
 * <RailBottom>
 *   <RailItem icon={<Settings2 />} label="Settings" href="/settings" />
 *   <RailTile shape="avatar" label="Ada Lovelace, account"><Avatar … /></RailTile>
 * </RailBottom>
 */
export function RailTile({
  label,
  shape = "tile",
  render,
  className,
  children,
  ...props
}: RailTileProps) {
  const element = render ?? <ButtonPrimitive />;
  const ownProps = element.props as ElementProps;
  return React.cloneElement(element, {
    ...props,
    ...ownProps,
    "data-slot": "rail-tile",
    "data-shape": shape,
    "aria-label": label,
    className: cn(
      "relative grid flex-none place-items-center self-center overflow-hidden font-semibold outline-none transition-[box-shadow] duration-instant [&_img]:size-full [&_img]:object-cover [&_[data-slot=avatar]]:size-full",
      // The focus tint (FOC-13) paints over the logo or the avatar, which would hide it beneath.
      "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:bg-state-focus",
      shape === "avatar"
        ? "mt-2.5 size-8 rounded-chip text-xs [&_[data-slot=avatar]]:size-full"
        : "size-9 rounded-tile bg-ink text-base text-ink-foreground",
      // A ring in the canvas, then a hairline: the tile reads as pressable without a border of its own.
      "shadow-[0_0_0_2px_var(--sidebar),0_0_0_3.5px_var(--border)] hover:shadow-[0_0_0_2px_var(--sidebar),0_0_0_3.5px_var(--input-hover)] data-popup-open:shadow-[0_0_0_2px_var(--sidebar),0_0_0_3.5px_var(--input-focus)]",
      className,
      ownProps.className,
    ),
    children,
  } as ElementProps);
}

/**
 * `RailBottom` — the rail's foot group, pinned to the bottom: Settings.
 *
 * @example
 * <RailBottom><RailItem icon={<Settings2 />} label="Settings" href="/settings" /></RailBottom>
 */
export function RailBottom({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rail-bottom"
      className={cn("mt-auto flex flex-col gap-0.5 pt-2", className)}
      {...props}
    />
  );
}
