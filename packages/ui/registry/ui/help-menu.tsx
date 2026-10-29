// @vegastack help-menu@0.25.98 sha256-oTtjiVV7P1udtBoy7oJlZgTskREulezFdY7FbCUP6+0=

import * as React from "react";
import {
  BookOpen,
  CircleHelp,
  Keyboard,
  LifeBuoy,
  Sparkles,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDot } from "@/components/ui/notification-bell";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

/* ---
`HelpMenu` is the one place to learn the product: What's new, the docs, the keyboard
shortcuts and support, plus the build version, behind one sidebar-footer item. In the
collapsed rail it is an icon with a tooltip, and the What's new dot moves onto the icon.

It composes `SidebarMenuItem` + `SidebarMenuButton` as a `DropdownMenu` trigger and
renders nothing of its own beyond the entries. Every entry is optional, and each is a link
(`href`, rendered through `linkRender` — your router's `Link`) or an action (`onSelect`,
say opening the shortcuts overlay). Framework-agnostic: no router import.
--- */

/** One entry of the menu: a link (`href`) or an action (`onSelect`). Omit the entry to hide it. */
export interface HelpMenuLink {
  /**
   * Where the entry goes. Rendered through `linkRender`, else a plain `<a>`.
   * @default undefined
   */
  href?: string;
  /**
   * Run instead of following a link — open the shortcuts overlay, a support chat.
   * @default undefined
   */
  onSelect?: () => void;
  /**
   * The entry's text; each entry has an English default.
   * @default undefined
   */
  label?: string;
  /**
   * Open the link in a new tab (`target="_blank" rel="noopener"`).
   * @default false
   */
  external?: boolean;
}

/** Props accepted by `HelpMenu`. */
export interface HelpMenuProps {
  /**
   * The entries, in this order: What's new · Docs · Keyboard shortcuts · Contact support. An
   * omitted entry is not shown.
   * @default {}
   */
  links?: {
    whatsNew?: HelpMenuLink;
    docs?: HelpMenuLink;
    shortcuts?: HelpMenuLink;
    support?: HelpMenuLink;
  };
  /**
   * Something new to read: What's new and the trigger carry the unread dot, and both say
   * `unreadLabel` to assistive technology.
   * @default false
   */
  whatsNewUnread?: boolean;
  /**
   * The build version line at the foot of the menu ("v1.8.21"). Omitted, no line.
   * @default undefined
   */
  version?: React.ReactNode;
  /**
   * The element each link entry renders as — your router's link (`<Link />`). The entry's
   * `href`, classes and children are merged into it.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * The trigger's text, and its tooltip in the collapsed rail.
   * @default "Help"
   */
  label?: string;
  /**
   * What the unread dot means, spoken after the trigger's and What's new's names.
   * @default "new updates"
   */
  unreadLabel?: string;
  /**
   * The keys shown beside Keyboard shortcuts.
   * @default "?"
   */
  shortcutsHint?: React.ReactNode;
  /**
   * Where the menu opens beside the trigger.
   * @default "top"
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * The menu's alignment along that side.
   * @default "start"
   */
  align?: "start" | "center" | "end";
  /**
   * Extra entries (`DropdownMenuItem`s), after Contact support and before the version.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * Classes for the sidebar item.
   * @default undefined
   */
  className?: string;
}

const DEFAULT_LABELS = {
  whatsNew: "What's new",
  docs: "Docs",
  shortcuts: "Keyboard shortcuts",
  support: "Contact support",
} as const;

const ICONS = {
  whatsNew: Sparkles,
  docs: BookOpen,
  shortcuts: Keyboard,
  support: LifeBuoy,
} as const;

const ORDER = ["whatsNew", "docs", "shortcuts", "support"] as const;

/** The entry's `render`: the caller's link element with `href` (and new-tab attributes) merged in. */
function linkElement(
  linkRender: React.ReactElement | undefined,
  link: HelpMenuLink,
): React.ReactElement | undefined {
  if (link.href === undefined) return undefined;
  const template = linkRender ?? <a />;
  return React.cloneElement(template, {
    href: link.href,
    ...(link.external ? { target: "_blank", rel: "noopener" } : {}),
  } as object);
}

/**
 * `HelpMenu` — the sidebar-footer Help item: one menu with What's new (marked with a dot while
 * `whatsNewUnread`), Docs, Keyboard shortcuts and Contact support, and the build version at its
 * foot. In the collapsed rail it is the help icon with a tooltip, the dot sitting on the icon.
 * Place it inside a `SidebarMenu` in `SidebarFooter`.
 *
 * @example
 * <SidebarFooter>
 *   <SidebarMenu>
 *     <HelpMenu
 *       whatsNewUnread={unread}
 *       version="v1.8.21"
 *       linkRender={<Link href="" />}
 *       links={{
 *         whatsNew: { href: "/docs/whats-new" },
 *         docs: { href: "/docs" },
 *         shortcuts: { onSelect: () => setShortcutsOpen(true) },
 *         support: { href: "mailto:support@example.com" },
 *       }}
 *     />
 *   </SidebarMenu>
 * </SidebarFooter>
 */
export function HelpMenu({
  links = {},
  whatsNewUnread = false,
  version,
  linkRender,
  label = "Help",
  unreadLabel = "new updates",
  shortcutsHint = "?",
  side = "top",
  align = "start",
  children,
  className,
}: HelpMenuProps) {
  const unread = whatsNewUnread && links.whatsNew !== undefined;
  return (
    <SidebarMenuItem data-slot="help-menu" className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip={unread ? `${label} (${unreadLabel})` : label}
            />
          }
          data-slot="help-menu-trigger"
        >
          <CircleHelp aria-hidden />
          <span>{label}</span>
          {unread ? (
            <>
              {/* Beside the label when expanded; on the icon's corner in the collapsed rail. */}
              <NotificationDot
                data-slot="help-menu-dot"
                className="ms-auto group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:end-1 group-data-[collapsible=icon]:top-1"
              />
              <span className="sr-only"> ({unreadLabel})</span>
            </>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-slot="help-menu-content"
          side={side}
          align={align}
          className="min-w-56"
        >
          <DropdownMenuGroup>
            {ORDER.map((key) => {
              const link = links[key];
              if (!link) return null;
              const Icon = ICONS[key];
              const text = link.label ?? DEFAULT_LABELS[key];
              return (
                <DropdownMenuItem
                  key={key}
                  data-slot="help-menu-item"
                  data-entry={key}
                  render={linkElement(linkRender, link)}
                  onClick={link.onSelect}
                >
                  <Icon aria-hidden />
                  <span>{text}</span>
                  {key === "whatsNew" && unread ? (
                    <>
                      <NotificationDot className="ms-auto" />
                      <span className="sr-only"> ({unreadLabel})</span>
                    </>
                  ) : null}
                  {key === "shortcuts" && shortcutsHint ? (
                    <DropdownMenuShortcut aria-hidden>
                      {shortcutsHint}
                    </DropdownMenuShortcut>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
            {children}
          </DropdownMenuGroup>
          {version !== undefined && version !== null ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel
                  data-slot="help-menu-version"
                  className="font-normal tabular-nums"
                >
                  {version}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
