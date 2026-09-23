"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/navigation-menu` (dogfoods the registry) → auto-scanned.
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { DirectionProvider } from "@/components/ui/direction";

/*
 * Upstream's own examples, adapted only for import paths and for `next/link` — which this docs app
 * does not route through — becoming a plain `<a href="#">`. Every fixture renders CLOSED: the menu
 * is revealed by hover or by keyboard on a trigger, and the geometry lane measures the nav row.
 */

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "#",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "#",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "#",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "#",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "#",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "#",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

function ListItem({
  title,
  children,
  href,
  ...props
}: ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink render={<a href={href} />}>
        <div className="flex flex-col gap-1 text-sm">
          <div className="leading-none font-medium">{title}</div>
          <div className="line-clamp-2 text-muted-foreground">{children}</div>
        </div>
      </NavigationMenuLink>
    </li>
  );
}

/**
 * Upstream's `NavigationMenuDemo`: three panels and a bare link styled as a trigger.
 *
 * Two changes from upstream's demo, both for small screens, because a navigation menu is a desktop
 * row: its list does not wrap, and its panel is as wide as its content, clipped at the available
 * width. Upstream already hides "Components" below `md`; "With Icon" is hidden below `sm` too, so
 * the row fits a 320px screen, and the first panel is `w-64` until `sm` instead of a fixed `w-96`,
 * so its text is never cut off. Below `sm`, a real app puts this navigation in a Sheet.
 */
export function navigationMenu(): ReactNode {
  return (
    <Wrapper className="min-h-72 items-start justify-center pt-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-64 sm:w-96">
                <ListItem href="#" title="Introduction">
                  Re-usable components built with Tailwind CSS.
                </ListItem>
                <ListItem href="#" title="Installation">
                  How to install dependencies and structure your app.
                </ListItem>
                <ListItem href="#" title="Typography">
                  Styles for headings, paragraphs, lists...etc
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className="hidden md:flex">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {components.map((component) => (
                  <ListItem
                    key={component.title}
                    title={component.title}
                    href={component.href}
                  >
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className="hidden sm:flex">
            <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px]">
                <li>
                  <NavigationMenuLink
                    render={
                      <a href="#" className="flex-row items-center gap-2" />
                    }
                  >
                    <CircleAlertIcon />
                    Backlog
                  </NavigationMenuLink>
                  <NavigationMenuLink
                    render={
                      <a href="#" className="flex-row items-center gap-2" />
                    }
                  >
                    <CircleDashedIcon />
                    To Do
                  </NavigationMenuLink>
                  <NavigationMenuLink
                    render={
                      <a href="#" className="flex-row items-center gap-2" />
                    }
                  >
                    <CircleCheckIcon />
                    Done
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={<a href="#" />}
              className={navigationMenuTriggerStyle()}
            >
              Docs
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Wrapper>
  );
}

/**
 * Upstream's composition tree, rendered. `NavigationMenu` owns the portal, the positioner, the
 * popup and the viewport itself, so the call site is Root → List → Item → Trigger/Content, with
 * `NavigationMenuIndicator` marking the trigger that opens a panel.
 */
export function navigationMenuComposition(): ReactNode {
  return (
    <Wrapper className="min-h-60 items-start justify-center pt-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              Item One
              <NavigationMenuIndicator />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-56">
                <li>
                  <NavigationMenuLink render={<a href="#" />}>
                    Link
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={<a href="#" />}
              className={navigationMenuTriggerStyle()}
            >
              Item Two
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Wrapper>
  );
}

/**
 * Upstream's `Link Component` section. Upstream composes `next/link` through `render`; this docs
 * app has no router, so the render target is a plain anchor. `navigationMenuTriggerStyle()` is what
 * makes a top-level link match the triggers beside it.
 */
export function navigationMenuLinkComponent(): ReactNode {
  return (
    <Wrapper className="items-start justify-center pt-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={<a href="#" />}
              className={navigationMenuTriggerStyle()}
            >
              Documentation
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </Wrapper>
  );
}

const rtlComponents: { title: string; description: string }[] = [
  {
    title: "حوار التنبيه",
    description: "حوار نافذة يقطع المستخدم بمحتوى مهم ويتوقع استجابة.",
  },
  {
    title: "بطاقة التحويم",
    description: "للمستخدمين المبصرين لمعاينة المحتوى المتاح خلف الرابط.",
  },
];

/**
 * Upstream's `NavigationMenuRtl`. Upstream drives the strings from its `language-selector` demo
 * hook; here they are inline and the direction comes from `DirectionProvider`, which is what Base
 * UI reads. `align` flips to `end` so the panel hangs from the right edge of the nav row, and `dir`
 * travels onto the content because the panel portals out of the `dir="rtl"` subtree. Both panels
 * are `w-64` until `sm` rather than upstream's fixed `w-80`, so they fit a 320px screen.
 */
export function navigationMenuRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper className="min-h-72 items-start justify-center pt-4" dir="rtl">
        <NavigationMenu align="end">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>البدء</NavigationMenuTrigger>
              <NavigationMenuContent dir="rtl">
                <ul className="w-64 sm:w-80">
                  <ListItem href="#" title="مقدمة">
                    مكونات قابلة لإعادة الاستخدام مبنية باستخدام Tailwind CSS.
                  </ListItem>
                  <ListItem href="#" title="التثبيت">
                    كيفية تثبيت التبعيات وتنظيم تطبيقك.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>المكونات</NavigationMenuTrigger>
              <NavigationMenuContent dir="rtl">
                <ul className="grid w-64 gap-2 sm:w-80">
                  {rtlComponents.map((component) => (
                    <ListItem
                      key={component.title}
                      title={component.title}
                      href="#"
                    >
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<a href="#" />}
                className={navigationMenuTriggerStyle()}
              >
                الوثائق
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </Wrapper>
    </DirectionProvider>
  );
}
