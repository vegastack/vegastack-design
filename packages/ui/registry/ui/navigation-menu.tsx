// @vegastack navigation-menu@0.3.0 sha256-mNZCRZ8MTNKkuAouQqFbNATxRuM0C44g4slI5jIJvis=

"use client";

import * as React from "react";
import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { ChevronDown } from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

/* ------------------------------------------------------------------------------------------------
 * NavigationMenu — the site-nav mega-dropdown (Wave 4, from the marketing-teardown nav anatomy):
 * chip triggers in a row; a single shared popup panel whose content swaps as the pointer moves
 * between triggers. Built on the Base UI NavigationMenu primitive (Root/List/Item/Trigger/
 * Content + Portal/Positioner/Popup/Viewport), styled to the system's overlay grammar:
 * `popover` surface, the one hairline, `--shadow-overlay`, `z-overlay`, fast scale/fade
 * enter with a 1px directional nudge (the teardown's menu-enter signature).
 * ----------------------------------------------------------------------------------------------*/

/** Props forwarded to the Base UI navigation-menu root. */
export type NavigationMenuProps = React.ComponentProps<
  typeof BaseNavigationMenu.Root
>;

/**
 * `NavigationMenu` — the root. Compose:
 *
 * @example
 * <NavigationMenu>
 *   <NavigationMenuList>
 *     <NavigationMenuItem>
 *       <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
 *       <NavigationMenuContent>
 *         <NavigationMenuGridLink href="/ai" title="Ask AI" description="Search and create with AI" icon={<Sparkles />} />
 *       </NavigationMenuContent>
 *     </NavigationMenuItem>
 *     <NavigationMenuItem>
 *       <NavigationMenuLink href="/pricing">Pricing</NavigationMenuLink>
 *     </NavigationMenuItem>
 *   </NavigationMenuList>
 *   <NavigationMenuPanel />
 * </NavigationMenu>
 */
export function NavigationMenu({ className, ...props }: NavigationMenuProps) {
  return (
    <BaseNavigationMenu.Root
      data-slot="navigation-menu"
      className={cn("relative", className)}
      {...props}
    />
  );
}

/** Props for the top-level navigation list. */
export type NavigationMenuListProps = React.ComponentProps<
  typeof BaseNavigationMenu.List
>;

/** `NavigationMenuList` — the horizontal row of triggers/links. @example <NavigationMenuList /> */
export function NavigationMenuList({
  className,
  ...props
}: NavigationMenuListProps) {
  return (
    <BaseNavigationMenu.List
      data-slot="navigation-menu-list"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

/** Props for one navigation-menu item. */
export type NavigationMenuItemProps = React.ComponentProps<
  typeof BaseNavigationMenu.Item
>;

/** `NavigationMenuItem` — one nav entry. @example <NavigationMenuItem /> */
export function NavigationMenuItem(props: NavigationMenuItemProps) {
  return (
    <BaseNavigationMenu.Item data-slot="navigation-menu-item" {...props} />
  );
}

const navTriggerClasses = cn(
  "inline-flex h-(--size-md) items-center gap-1 rounded-md px-3 text-label text-muted-foreground select-none",
  " hover:bg-muted hover:text-foreground",
  // Open trigger stays lit (the teardown's open-equals-hover rule).
  "data-[popup-open]:bg-muted data-[popup-open]:text-foreground",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-inline)",
);

/** Props forwarded to a disclosure trigger. */
export type NavigationMenuTriggerProps = React.ComponentProps<
  typeof BaseNavigationMenu.Trigger
>;

/** `NavigationMenuTrigger` — a chip trigger with a rotating chevron. @example <NavigationMenuTrigger>Platform</NavigationMenuTrigger> */
export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuTriggerProps) {
  return (
    <BaseNavigationMenu.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navTriggerClasses, className)}
      {...props}
    >
      {children}
      <BaseNavigationMenu.Icon className="transition-transform duration-fast ease-standard data-[popup-open]:rotate-180">
        <ChevronDown aria-hidden />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

/** Props for one item's content inside the shared viewport. */
export type NavigationMenuContentProps = React.ComponentProps<
  typeof BaseNavigationMenu.Content
>;

/**
 * `NavigationMenuContent` — the panel content for one item. Swapping between
 * items slides content inside the shared popup; entering/leaving fades.
 * @example <NavigationMenuContent>Links</NavigationMenuContent>
 */
export function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuContentProps) {
  return (
    <BaseNavigationMenu.Content
      data-slot="navigation-menu-content"
      className={cn(
        "w-max max-w-5xl p-2",
        "transition-opacity duration-fast ease-standard data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

/** Props forwarded to a plain Base UI navigation link. */
export type NavigationMenuLinkProps = React.ComponentProps<
  typeof BaseNavigationMenu.Link
>;

/** `NavigationMenuLink` — a plain nav link styled like a trigger. @example <NavigationMenuLink href="/pricing">Pricing</NavigationMenuLink> */
export function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuLinkProps) {
  return (
    <BaseNavigationMenu.Link
      data-slot="navigation-menu-link"
      className={cn(navTriggerClasses, className)}
      {...props}
    />
  );
}

/** Props forwarded to the shared portaled positioner. */
export type NavigationMenuPanelProps = React.ComponentProps<
  typeof BaseNavigationMenu.Positioner
>;

/**
 * `NavigationMenuPanel` — the SHARED floating panel every item's content renders
 * into (Base UI Portal → Positioner → Popup → Viewport). Render it once, after
 * the list. Overlay grammar: popover surface + hairline + `--shadow-overlay` +
 * scale-0.97/1px-nudge enter.
 * @example <NavigationMenuPanel />
 */
export function NavigationMenuPanel({
  className,
  sideOffset = FLOATING.sideOffsetDetached,
  ...props
}: NavigationMenuPanelProps) {
  const themeScope = useInternalThemeScope();

  return (
    <BaseNavigationMenu.Portal>
      <BaseNavigationMenu.Positioner
        data-slot="navigation-menu-positioner"
        sideOffset={sideOffset}
        className={cn(
          themeScope,
          "z-(--z-overlay) h-(--positioner-height) w-(--positioner-width) transition-[top,left,right,bottom] duration-base ease-standard",
          className,
        )}
        {...props}
      >
        <BaseNavigationMenu.Popup
          data-slot="navigation-menu-popup"
          className={cn(
            themeScope,
            "h-(--popup-height) w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay sm:w-(--popup-width)",
            "transition-[opacity,transform,width,height] duration-base ease-standard",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:-translate-y-px",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
          )}
        >
          <BaseNavigationMenu.Viewport
            data-slot="navigation-menu-viewport"
            className={cn(themeScope, "relative h-full w-full overflow-hidden")}
          />
        </BaseNavigationMenu.Popup>
      </BaseNavigationMenu.Positioner>
    </BaseNavigationMenu.Portal>
  );
}

/** Props for a descriptive grid link inside navigation-menu content. */
export interface NavigationMenuGridLinkProps extends Omit<
  React.ComponentProps<typeof BaseNavigationMenu.Link>,
  "title"
> {
  /** Leading icon (decorative). @default undefined */
  icon?: React.ReactNode;
  /** The entry name — ink voice. */
  title: React.ReactNode;
  /** Muted one-line description under the title. @default undefined */
  description?: React.ReactNode;
}

/**
 * `NavigationMenuGridLink` — a mega-menu grid entry: icon + title + muted
 * description, hierarchy carried by color at one size (the teardown's menu
 * typography rule). Lay several out in a `grid grid-cols-2` content panel.
 * @example <NavigationMenuGridLink href="/ai" title="Ask AI" />
 */
export function NavigationMenuGridLink({
  className,
  icon,
  title,
  description,
  ...props
}: NavigationMenuGridLinkProps) {
  return (
    <BaseNavigationMenu.Link
      data-slot="navigation-menu-grid-link"
      className={cn(
        "flex items-start gap-3 rounded-md p-3 no-underline  select-none hover:bg-muted",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default) [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden className="mt-0.5 shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label text-foreground">{title}</span>
        {description ? (
          <span className="text-base font-normal text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </BaseNavigationMenu.Link>
  );
}
