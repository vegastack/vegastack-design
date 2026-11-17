// @vegastack help-menu@0.111.0 sha256-ZZN4jzchFAWZk6dAM+7wnNy2BsTenecozB7XLHgWluA=

import * as React from "react";
import { cn } from "@vegastack/design";
import { BookOpen, Keyboard, LifeBuoy, Sparkles } from "lucide-react";

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
import { NotificationDot } from "@/components/ui/notification-dot";

/* ---
`HelpMenu` is the one place to learn the product: What's new, the docs, the keyboard
shortcuts and support, plus the build version, behind the Help button in the global bar.

The trigger is yours — the global bar's Help button, with the What's new dot on it — rendered as
the `DropdownMenu` trigger; the menu renders nothing of its own beyond the entries. Every entry is optional, and each is a link
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
   * Something new to read: What's new carries the unread dot and says `unreadLabel` to assistive
   * technology; give your trigger the same dot.
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
   * What the unread dot means, spoken after What's new's name (give your trigger's dot the same
   * words).
   * @default "new updates"
   */
  unreadLabel?: string;
  /**
   * The keys shown beside Keyboard shortcuts.
   * @default "?"
   */
  shortcutsHint?: React.ReactNode;
  /**
   * The trigger: the Help button in the global bar's trailing slot, a ghost `icon-sm` button with
   * a `NotificationDot` while something is unread. It is rendered through the menu trigger, so it
   * owns its icon, name and dot.
   */
  trigger: React.ReactElement;
  /**
   * Where the menu opens beside the trigger: under the global bar's Help button.
   * @default "bottom"
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * The menu's alignment along that side: the bar's end.
   * @default "end"
   */
  align?: "start" | "center" | "end";
  /**
   * Extra entries (`DropdownMenuItem`s), after Contact support and before the version.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * Classes for the menu's wrapper.
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
 * `HelpMenu` — the Help button in the global bar: one menu with What's new (marked with a dot
 * while `whatsNewUnread`), Docs, Keyboard shortcuts and Contact support, and the build version at
 * its foot. The trigger is the Help button you pass, with the dot on it.
 *
 * @example
 * <GlobalBarTrailing>
 *   <HelpMenu
 *     trigger={<Button variant="ghost" size="icon-sm" aria-label={unread ? "Help (new updates)" : "Help"} className="relative"><CircleHelp />{unread ? <NotificationDot className="absolute top-0.5 end-0.5" /> : null}</Button>}
 *     whatsNewUnread={unread}
 *     version="v1.8.21"
 *     linkRender={<Link href="" />}
 *     links={{
 *       whatsNew: { href: "/docs/whats-new" },
 *       docs: { href: "/docs" },
 *       shortcuts: { onSelect: () => setShortcutsOpen(true) },
 *       support: { href: "mailto:support@example.com" },
 *     }}
 *   />
 * </GlobalBarTrailing>
 */
export function HelpMenu({
  links = {},
  whatsNewUnread = false,
  version,
  linkRender,
  unreadLabel = "new updates",
  shortcutsHint = "?",
  side = "bottom",
  align = "end",
  trigger,
  children,
  className,
}: HelpMenuProps) {
  const unread = whatsNewUnread && links.whatsNew !== undefined;
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} data-slot="help-menu-trigger" />
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
  );
  return (
    <div data-slot="help-menu" className={cn("contents", className)}>
      {menu}
    </div>
  );
}
