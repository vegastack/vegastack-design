// @vegastack route-tabs@0.25.98 sha256-NTiawT7HdWhIiADOaSqJ14fufoqlzTdvHDqH1Wf1g7o=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { tabsListVariants, tabsTriggerVariants } from "@/components/ui/tabs";

/* ---
`RouteTabs` are Tabs whose panels are pages: a named `nav` of links drawn as the
default pill tabs, one URL per tab. Put them in the segment's layout so a switch swaps
only the page below them.

The router stays the app's. The current tab comes from `currentHref` (the pathname),
links render through `linkRender` (your router's `Link`), and nothing here imports a
framework. A clicked tab shows as current at once and carries a pending bar until
`currentHref` moves, so a slow page never leaves the previous tab looking chosen; the
previous page dims through `RouteTabsPanel` (wrap both in `RouteTabsProvider`, or pass
`pending` yourself).
--- */

/** One tab: a page and how its link reads. */
export interface RouteTab {
  /** The page this tab opens. */
  href: string;
  /** The tab's text. */
  label: React.ReactNode;
  /**
   * A muted `tabular-nums` count after the label (`null` or omitted: none).
   * @default undefined
   */
  count?: number | null;
  /**
   * The link's accessible name when the visible text is not enough ("Tasks, 3 open").
   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Other paths that show this tab as current (a record's dialog route, a nested page).
   * @default undefined
   */
  also?: readonly string[];
}

/** Props accepted by `RouteTabs`. */
export interface RouteTabsProps extends Omit<
  React.ComponentPropsWithRef<"nav">,
  "children"
> {
  /** The nav landmark's accessible name ("Connections"). */
  label: string;
  /** The tabs, in order. */
  tabs: readonly RouteTab[];
  /**
   * The page being shown — the router's pathname. The tab whose `href` (or one of whose `also`
   * paths) equals it is current.
   * @default undefined
   */
  currentHref?: string | null;
  /**
   * The tab whose page is loading. Omitted, the tabs track it themselves: a click marks its tab
   * until `currentHref` changes. Pass it (with `onPendingHrefChange`) to drive it from the router.
   * @default undefined
   */
  pendingHref?: string | null;
  /**
   * Fired when a tab starts loading (its `href`) and when loading ends or is cancelled (`null`).
   * With `pendingHref` controlled it carries the click's request — pass it back as `pendingHref`,
   * and clear it yourself once the router lands.
   * @default undefined
   */
  onPendingHrefChange?: (href: string | null) => void;
  /**
   * The element each tab renders as — your router's link (`<Link scroll={false} />`). The tab's
   * `href`, classes, `aria-current`, data attributes and children are merged into it; its own
   * `onClick` still runs.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * `scroll` lets a long strip scroll sideways, keeping the current tab in view; `visible` never
   * clips.
   * @default "visible"
   */
  overflow?: "scroll" | "visible";
  /**
   * Formats a tab's count.
   * @default (n) => n.toLocaleString("en")
   */
  formatCount?: (count: number) => string;
}

type PendingStore = {
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
};

const RouteTabsPendingContext = React.createContext<PendingStore | null>(null);

/** Props accepted by `RouteTabsProvider`. */
export interface RouteTabsProviderProps {
  /** The tabs and the panel they switch, anywhere below. */
  children: React.ReactNode;
}

/**
 * `RouteTabsProvider` — shares the loading tab between `RouteTabs` and `RouteTabsPanel` when they
 * sit apart (the tabs in a header, the page below). Optional: without it, pass `pending` to the
 * panel yourself.
 *
 * @example
 * <RouteTabsProvider>
 *   <RouteTabs label="Connections" tabs={tabs} currentHref={pathname} />
 *   <RouteTabsPanel>{children}</RouteTabsPanel>
 * </RouteTabsProvider>
 */
export function RouteTabsProvider({ children }: RouteTabsProviderProps) {
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const value = React.useMemo(
    () => ({ pendingHref, setPendingHref }),
    [pendingHref],
  );
  return (
    <RouteTabsPendingContext.Provider value={value}>
      {children}
    </RouteTabsPendingContext.Provider>
  );
}

/** Merge the tab's props into the caller's link element (default `<a>`), keeping its `onClick`. */
function linkElement(
  linkRender: React.ReactElement | undefined,
  props: Record<string, unknown> & {
    className: string;
    onClick: React.MouseEventHandler<HTMLElement>;
  },
  children: React.ReactNode,
): React.ReactElement {
  const template = (linkRender ?? <a />) as React.ReactElement<{
    className?: string;
    onClick?: React.MouseEventHandler<HTMLElement>;
  }>;
  const own = template.props.onClick;
  return React.cloneElement(
    template,
    {
      ...props,
      className: cn(props.className, template.props.className),
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        own?.(event);
        props.onClick(event);
      },
    } as object,
    children,
  );
}

/**
 * `RouteTabs` — page tabs: a named `nav` of links drawn as the default pill tabs, the current one
 * marked `aria-current="page"`. A clicked tab is current at once and shows a pending bar until the
 * page arrives (`currentHref` changes); with `overflow="scroll"` the strip scrolls sideways and
 * keeps the current tab in view, counts arriving late included.
 *
 * @example
 * <RouteTabs
 *   label="Connections"
 *   currentHref={pathname}
 *   linkRender={<Link href="" scroll={false} />}
 *   tabs={[
 *     { href: "/connections", label: "Your connections" },
 *     { href: "/connections/everyone", label: "Everyone", count: 12 },
 *     { href: "/connections/activity", label: "Activity", also: ["/connections/activity/42"] },
 *   ]}
 * />
 */
export function RouteTabs({
  label,
  tabs,
  currentHref = null,
  pendingHref: pendingProp,
  onPendingHrefChange,
  linkRender,
  overflow = "visible",
  formatCount = (n) => n.toLocaleString("en"),
  className,
  ...props
}: RouteTabsProps) {
  const store = React.useContext(RouteTabsPendingContext);
  const [clicked, setClicked] = React.useState<{
    from: string | null;
    href: string;
  } | null>(null);
  // A click counts only until the page moves (the navigation landed, was replaced, or Back ran):
  // then it is spent, so returning to the page it left never revives it.
  if (clicked && clicked.from !== currentHref) setClicked(null);
  const tracked = clicked && clicked.from === currentHref ? clicked.href : null;
  const pending = pendingProp === undefined ? tracked : pendingProp;
  const matched =
    tabs.find(
      (t) =>
        currentHref !== null &&
        (t.href === currentHref || t.also?.includes(currentHref)),
    )?.href ?? null;
  const current = pending ?? matched;

  // Report loading start and end, to the caller and to a provider's panel.
  const report = React.useRef({ onPendingHrefChange, store });
  React.useEffect(() => {
    report.current = { onPendingHrefChange, store };
  });
  const controlled = pendingProp !== undefined;
  // The provider's panel mirrors the effective pending tab. Uncontrolled, the caller hears each
  // start and end here; controlled, it hears the requests from the click itself (below), because
  // the effective value only moves once the caller passes it back.
  const reported = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (reported.current === pending) return;
    reported.current = pending;
    if (!controlled) report.current.onPendingHrefChange?.(pending);
    report.current.store?.setPendingHref(pending);
  }, [pending, controlled]);
  const request = (href: string | null) => {
    if (controlled) onPendingHrefChange?.(href);
    else setClicked(href === null ? null : { from: currentHref, href });
  };

  const strip = React.useRef<HTMLDivElement>(null);
  // Counts arrive after the first paint and widen the tabs: keep the current one in view then too.
  const layoutKey = tabs.map((t) => `${t.href}:${t.count ?? ""}`).join("|");
  React.useEffect(() => {
    const box = strip.current;
    const active = box?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!box || !active) return;
    const outer = box.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    if (tab.left < outer.left) box.scrollLeft += tab.left - outer.left;
    else if (tab.right > outer.right) box.scrollLeft += tab.right - outer.right;
  }, [current, layoutKey]);

  return (
    <nav
      aria-label={label}
      aria-busy={pending ? true : undefined}
      data-slot="route-tabs"
      data-orientation="horizontal"
      data-pending={pending ? "" : undefined}
      className={cn("group/tabs flex min-w-0", className)}
      {...props}
    >
      <div
        ref={strip}
        data-slot="tabs-list"
        data-orientation="horizontal"
        data-variant="default"
        data-overflow={overflow}
        className={tabsListVariants({ variant: "default", overflow })}
      >
        {tabs.map((tab) => {
          const isCurrent = tab.href === current;
          const isPending = tab.href === pending;
          return (
            <React.Fragment key={tab.href}>
              {linkElement(
                linkRender,
                {
                  href: tab.href,
                  "aria-current": isCurrent ? "page" : undefined,
                  "aria-label": tab["aria-label"],
                  "data-active": isCurrent ? "" : undefined,
                  "data-pending": isPending ? "" : undefined,
                  "data-slot": "tabs-trigger",
                  className: tabsTriggerVariants(),
                  onClick: (event) => {
                    if (
                      event.defaultPrevented ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey ||
                      event.button !== 0 ||
                      tab.href === current
                    )
                      return;
                    // Back to the page already shown: nothing will load, so nothing is pending.
                    request(tab.href === matched ? null : tab.href);
                  },
                },
                <>
                  {tab.label}
                  {tab.count === null || tab.count === undefined ? null : (
                    <span className="text-muted-foreground tabular-nums">
                      {formatCount(tab.count)}
                    </span>
                  )}
                  {isPending ? (
                    <span
                      aria-hidden
                      data-slot="route-tabs-pending"
                      className="pointer-events-none absolute inset-x-1.5 bottom-0.5 h-0.5 overflow-hidden rounded-full"
                    >
                      <span className="absolute inset-y-0 w-1/3 rounded-full bg-primary motion-indeterminate" />
                    </span>
                  ) : null}
                </>,
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}

/** Props accepted by `RouteTabsPanel`. */
export interface RouteTabsPanelProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The page is being replaced: it dims and is marked busy. Omitted, it follows the nearest
   * `RouteTabsProvider`.
   * @default undefined
   */
  pending?: boolean;
}

/**
 * `RouteTabsPanel` — the page below `RouteTabs`. While another tab's page loads it dims and is
 * marked `aria-busy` and `data-pending`, so the old page never reads as the new one.
 *
 * @example
 * <RouteTabsPanel pending={pendingHref !== null}>{children}</RouteTabsPanel>
 */
export function RouteTabsPanel({
  pending,
  className,
  ...props
}: RouteTabsPanelProps) {
  const store = React.useContext(RouteTabsPendingContext);
  const busy = pending ?? (store ? store.pendingHref !== null : false);
  return (
    <div
      data-slot="route-tabs-panel"
      data-pending={busy ? "" : undefined}
      aria-busy={busy ? true : undefined}
      className={cn(
        "transition-opacity duration-150 data-pending:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
