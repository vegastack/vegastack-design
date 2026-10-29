// @vegastack sidebar-menu-flyout@0.25.100 sha256-CrdJEScGpQMTphM50N8gfzT77JnpBRrXlUiYQA9aU0k=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/** Props accepted by `SidebarMenuFlyout`. */
export interface SidebarMenuFlyoutProps extends Omit<
  React.ComponentPropsWithRef<"li">,
  "children"
> {
  /** The row's name: the trigger's label, its tooltip, and the flyout's heading. */
  label: string;
  /** The row's icon — all that shows of it in the icon rail. */
  icon: React.ReactNode;
  /**
   * The flyout's entries: `DropdownMenuItem`s (links through `render={<Link href="…" />}`), with
   * `DropdownMenuSeparator`s between sets ("+ New space" last).
   */
  children: React.ReactNode;
  /**
   * The row is current — one of its entries is the page on screen.
   * @default false
   */
  isActive?: boolean;
  /**
   * A count on the row, as on `SidebarMenuButton` (a dot or a short pill in the rail).
   * @default undefined
   */
  badge?: React.ReactNode;
  /**
   * The count's words in the row's name ("3 unread"), as on `SidebarMenuButton`.
   * @default undefined
   */
  badgeLabel?: string;
  /**
   * Show the row only in the collapsed icon rail — for entries the expanded sidebar lists inline
   * (a Spaces group) and the phone drawer lists in full.
   * @default false
   */
  railOnly?: boolean;
  /**
   * Milliseconds the pointer rests on the row before the flyout opens.
   * @default 100
   */
  delay?: number;
  /**
   * Milliseconds the flyout stays after the pointer leaves, so it can travel into it.
   * @default 200
   */
  closeDelay?: number;
}

/**
 * `SidebarMenuFlyout` — a sidebar row whose entries open beside it instead of under it: hover (or
 * Enter / Space) opens a menu at the row's side, headed by the row's label, with the entries the
 * host passes. Its job is the collapsed icon rail, where nested lists (Spaces) have no room:
 * `railOnly` shows the row in the rail alone, so the expanded sidebar keeps its inline group. The
 * flyout is a menu: ↑/↓ walk the entries, Escape closes it and returns focus to the row. Counts
 * work as on `SidebarMenuButton`.
 *
 * @example
 * <SidebarMenu>
 *   <SidebarMenuFlyout label="Spaces" icon={<LayoutGrid />} railOnly>
 *     {spaces.map((s) => (
 *       <DropdownMenuItem key={s.id} render={<Link href={s.href} />}>{s.name}</DropdownMenuItem>
 *     ))}
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem render={<Link href="/spaces/new" />}><Plus />New space</DropdownMenuItem>
 *   </SidebarMenuFlyout>
 * </SidebarMenu>
 */
export function SidebarMenuFlyout({
  label,
  icon,
  children,
  isActive = false,
  badge,
  badgeLabel,
  railOnly = false,
  delay = 100,
  closeDelay = 200,
  className,
  ...props
}: SidebarMenuFlyoutProps) {
  const { state, isMobile } = useSidebar();
  const [open, setOpen] = React.useState(false);
  return (
    <SidebarMenuItem
      data-slot="sidebar-menu-flyout"
      data-rail-only={railOnly ? "" : undefined}
      className={cn(
        railOnly && "hidden group-data-[collapsible=icon]:block",
        className,
      )}
      {...props}
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          openOnHover={!isMobile}
          delay={delay}
          closeDelay={closeDelay}
          render={
            <SidebarMenuButton
              data-slot="sidebar-menu-flyout-trigger"
              isActive={isActive}
              badge={badge}
              badgeLabel={badgeLabel}
              tooltip={{
                children: label,
                // The flyout names itself; the tooltip serves keyboard focus in the rail.
                hidden: open || state !== "collapsed" || isMobile,
              }}
            />
          }
        >
          {icon}
          <span>{label}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-slot="sidebar-menu-flyout-content"
          side={isMobile ? "bottom" : "right"}
          align="start"
          sideOffset={8}
          className="min-w-48"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel data-slot="sidebar-menu-flyout-label">
              {label}
            </DropdownMenuLabel>
            {children}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
