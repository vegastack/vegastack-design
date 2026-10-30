// @vegastack settings-layout@0.26.3 sha256-lhfWYmPVfnnsQRnE13xWoVA/uUrv4+4KLPYGyE2McVg=

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * SettingsLayout — the two-pane Settings workspace: a 220px section nav that stays in view and ONE
 * content column of up to 960px beside it, so every settings page starts at the same x and never
 * changes width between siblings. Inside the column a form is capped at 720px and left-aligned
 * (`SettingsLayoutContent kind="form"`); a list fills the column (`kind="list"`).
 *
 * The layout follows its OWN width (`@container/settings-layout`), not the viewport: below 42rem
 * (a phone, a narrow split view) it shows one pane at a time, iOS-style — the nav is the first
 * screen (`view="nav"`), and a page pushes in over it with a "‹ Settings" link back
 * (`view="content"`). At 42rem and wider both panes show, whatever `view` says.
 *
 * Framework-agnostic: links render through `linkRender` (`<Link />` from Next, say), with the
 * `href`, the class and `aria-current` merged in. Pure presentational and server-safe — no hooks,
 * no `'use client'`; the host passes the current path.
 * ----------------------------------------------------------------------------------------------*/

/** One page in a `SettingsNav` section. */
export interface SettingsNavItem {
  /** Where the item goes; also what `activeHref` is compared with. */
  href: string;
  /** The item's name. */
  label: React.ReactNode;
  /**
   * A count or a short status after the name ("3", "New") — part of the link's accessible name.
   * A number renders as a muted tabular count; any other node renders as given.
   * @default undefined
   */
  badge?: React.ReactNode;
}

/** One labelled group of `SettingsNav` items ("Account", "Workspace"). */
export interface SettingsNavSection {
  /** The group's label, shown above its items and naming their list. Omit for an unlabelled group. @default undefined */
  label?: React.ReactNode;
  /** The pages in this group, in order. */
  items: readonly SettingsNavItem[];
}

/** Props accepted by `SettingsNav`. */
export interface SettingsNavProps extends Omit<
  React.ComponentProps<"nav">,
  "children"
> {
  /** The groups of pages, in order. */
  sections: readonly SettingsNavSection[];
  /**
   * The current path. The item it names is current, else its nearest ancestor — the longest `href`
   * it sits under (`/settings/teams/42` marks Teams) — so only one item is ever current. Ignored
   * when `isActive` is given.
   * @default undefined
   */
  activeHref?: string;
  /**
   * Decides which item is current, for routing that `activeHref` cannot express.
   * @default prefix match on `activeHref`
   */
  isActive?: (item: SettingsNavItem) => boolean;
  /**
   * The element each item renders as — your router's link (`<Link />`). The item's `href`,
   * classes, `aria-current` and children are merged into it.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * The nav landmark's accessible name.
   * @default "Settings"
   */
  "aria-label"?: string;
}

/** Whether `href` is the current page or a page under it. */
function matchesPath(path: string, href: string): boolean {
  if (path === href) return true;
  const base = href.endsWith("/") ? href : `${href}/`;
  return path.startsWith(base);
}

/**
 * The ONE current item's href: the item `activeHref` names exactly, else its nearest ancestor (the
 * longest matching href) — so Profile and Profile › Advanced never both claim the page.
 */
function currentHref(
  sections: readonly SettingsNavSection[],
  activeHref: string | undefined,
): string | undefined {
  if (activeHref === undefined) return undefined;
  const path = activeHref.split(/[?#]/)[0] ?? "";
  let best: string | undefined;
  for (const section of sections) {
    for (const item of section.items) {
      if (
        matchesPath(path, item.href) &&
        (best === undefined || item.href.length > best.length)
      ) {
        best = item.href;
      }
    }
  }
  return best;
}

/** Merge `href`, classes and props into the caller's link element (default `<a>`). */
function renderLink(
  linkRender: React.ReactElement | undefined,
  props: Record<string, unknown> & { className?: string },
): React.ReactElement {
  const template = (linkRender ?? <a />) as React.ReactElement<{
    className?: string;
  }>;
  return React.cloneElement(template, {
    ...props,
    className: cn(props.className, template.props.className),
  } as object);
}

/**
 * `SettingsNav` — the Settings section nav: labelled groups of page links, the current page marked
 * with `aria-current="page"` and the accent fill, each item with an optional count. In the
 * 220px desktop pane it is a compact list; given a phone's width (`SettingsLayout view="nav"`) its
 * rows grow to 44px touch rows with a trailing chevron, because there it IS the first screen.
 *
 * Server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsNav
 *   activeHref={pathname}
 *   linkRender={<Link href="" />}
 *   sections={[
 *     { label: "Account", items: [{ href: "/settings/profile", label: "Profile" }] },
 *     { label: "Workspace", items: [{ href: "/settings/members", label: "Members", badge: 3 }] },
 *   ]}
 * />
 */
export function SettingsNav({
  sections,
  activeHref,
  isActive,
  linkRender,
  className,
  "aria-label": ariaLabel = "Settings",
  ref,
  ...props
}: SettingsNavProps) {
  const id = React.useId();
  const current = isActive ? undefined : currentHref(sections, activeHref);
  return (
    <nav
      ref={ref}
      data-slot="settings-nav"
      aria-label={ariaLabel}
      className={cn("@container/settings-nav flex flex-col gap-5", className)}
      {...props}
    >
      {sections.map((section, sectionIndex) => {
        const labelId = `${id}-section-${sectionIndex}`;
        return (
          <div
            key={sectionIndex}
            data-slot="settings-nav-section"
            className="flex flex-col gap-1"
          >
            {section.label != null ? (
              <p
                id={labelId}
                data-slot="settings-nav-section-label"
                className="px-2 text-xs font-medium text-muted-foreground"
              >
                {section.label}
              </p>
            ) : null}
            <ul
              aria-labelledby={section.label != null ? labelId : undefined}
              className="flex flex-col gap-0.5"
            >
              {section.items.map((item) => {
                const active = isActive
                  ? isActive(item)
                  : item.href === current;
                return (
                  <li key={item.href} className="flex">
                    {renderLink(linkRender, {
                      href: item.href,
                      "data-slot": "settings-nav-item",
                      "data-active": active ? "" : undefined,
                      "aria-current": active ? "page" : undefined,
                      className:
                        "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm text-foreground transition-colors duration-100 hover:bg-accent data-active:bg-accent data-active:font-medium @xs/settings-nav:h-11",
                      children: (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                          {item.badge != null && item.badge !== false ? (
                            <span
                              data-slot="settings-nav-badge"
                              className={cn(
                                "shrink-0",
                                typeof item.badge === "number" &&
                                  "text-xs text-muted-foreground tabular-nums",
                              )}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                          <ChevronRight
                            aria-hidden
                            className="hidden size-4 shrink-0 text-muted-foreground @xs/settings-nav:block rtl:rotate-180"
                          />
                        </>
                      ),
                    })}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** Props accepted by `SettingsLayout`. */
export interface SettingsLayoutProps extends React.ComponentProps<"div"> {
  /** The section nav — a `SettingsNav`. */
  nav: React.ReactNode;
  /**
   * Which pane shows while the layout is narrower than 42rem (a phone): `nav` — the section list
   * is the screen (the Settings index); `content` — the page, with a back link to the nav. At
   * 42rem and wider both panes always show.
   * @default "content"
   */
  view?: "nav" | "content";
  /**
   * Where the narrow layout's back link goes — the Settings index that shows the nav. Omit to
   * show no back link.
   * @default undefined
   */
  backHref?: string;
  /**
   * The back link's text, after a "‹".
   * @default "Settings"
   */
  backLabel?: string;
  /**
   * The element the back link renders as — your router's link (`<Link />`).
   * @default <a />
   */
  linkRender?: React.ReactElement;
}

/**
 * `SettingsLayout` — the two-pane Settings frame: `nav` in a 220px column that sticks below the
 * page's top edge while the page scrolls, and the page (`children`, usually one
 * `SettingsLayoutContent`) in one column of up to 960px beside it. Below 42rem of its own width
 * it shows one pane at a time — see `view`. It owns its geometry inside whatever page width the
 * app gives it (an `AppShellPage` at the default 1280px measure fits both panes).
 *
 * Server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsLayout
 *   view={pathname === "/settings" ? "nav" : "content"}
 *   backHref="/settings"
 *   linkRender={<Link href="" />}
 *   nav={<SettingsNav sections={SECTIONS} activeHref={pathname} linkRender={<Link href="" />} />}
 * >
 *   <SettingsLayoutContent kind="form">…</SettingsLayoutContent>
 * </SettingsLayout>
 */
export function SettingsLayout({
  nav,
  view = "content",
  backHref,
  backLabel = "Settings",
  linkRender,
  className,
  children,
  ref,
  ...props
}: SettingsLayoutProps) {
  return (
    <div
      ref={ref}
      data-slot="settings-layout"
      data-view={view}
      className={cn("@container/settings-layout w-full min-w-0", className)}
      {...props}
    >
      <div className="grid grid-cols-1 gap-6 @2xl/settings-layout:grid-cols-[13.75rem_minmax(0,60rem)] @2xl/settings-layout:items-start @2xl/settings-layout:gap-8">
        <div
          data-slot="settings-layout-nav"
          className={cn(
            "min-w-0 @2xl/settings-layout:sticky @2xl/settings-layout:top-[var(--page-gutter,1.5rem)]",
            view === "content" && "@max-2xl/settings-layout:hidden",
          )}
        >
          {nav}
        </div>
        <div
          data-slot="settings-layout-main"
          className={cn(
            "flex min-w-0 flex-col gap-4",
            view === "nav" && "@max-2xl/settings-layout:hidden",
          )}
        >
          {backHref !== undefined
            ? renderLink(linkRender, {
                href: backHref,
                "data-slot": "settings-layout-back",
                className:
                  "-ms-2 inline-flex h-8 w-fit items-center gap-1 rounded-md pe-2 ps-1 text-sm text-muted-foreground transition-colors duration-100 hover:bg-accent hover:text-foreground @2xl/settings-layout:hidden",
                children: (
                  <>
                    <ChevronLeft
                      aria-hidden
                      className="size-4 shrink-0 rtl:rotate-180"
                    />
                    {backLabel}
                  </>
                ),
              })
            : null}
          {children}
        </div>
      </div>
    </div>
  );
}

/** Props accepted by `SettingsLayoutContent`. */
export interface SettingsLayoutContentProps extends React.ComponentProps<"div"> {
  /**
   * The page's measure in the 960px column: `form` — capped at 720px and left-aligned (sections of
   * settings rows); `list` — the whole column (a members table, a list of attributes).
   * @default "form"
   */
  kind?: "form" | "list";
}

/**
 * `SettingsLayoutContent` — one settings page inside `SettingsLayout`: a vertical stack (the
 * page header, then its sections) at the page kind's measure. Both kinds start at the same x, so
 * moving between a form page and a list page never moves the left edge.
 *
 * Server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsLayoutContent kind="list">
 *   <PageHeader title="Members" />
 *   <DataList … />
 * </SettingsLayoutContent>
 */
export function SettingsLayoutContent({
  kind = "form",
  className,
  ref,
  ...props
}: SettingsLayoutContentProps) {
  return (
    <div
      ref={ref}
      data-slot="settings-layout-content"
      data-kind={kind}
      className={cn(
        "flex w-full min-w-0 flex-col gap-6",
        kind === "form" && "max-w-180",
        className,
      )}
      {...props}
    />
  );
}
