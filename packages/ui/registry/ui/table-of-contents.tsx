// @vegastack table-of-contents@0.23.122 sha256-WD5WCEn7yaAB520ScMpRRafmzv6bA79YL/XjW27nMnQ=

"use client";

import * as React from "react";
import { ListTree } from "lucide-react";
import { cn } from "@vegastack/design";

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useListNav } from "@/components/ui/use-list-nav";
import { usePrefersReducedMotion } from "@/components/ui/use-media-query";

/* ---
`TableOfContents` — the "On this page" outline for a long document, adapted from the page outline
the reference platform ships (an activation-line scroll spy and a rail of ticks that opens into a
labelled panel), rebuilt on this system's parts:

- The spy is NOT an IntersectionObserver. On every scroll (rAF-throttled, passive, captured on
  `window` so a nested scroller counts too) the active heading is the LAST one whose top is at or
  above an activation line `min(180px, 28% of the viewport)` below the scroll container's top edge;
  when the container is scrolled to its bottom the last heading is forced active, which is what
  makes a short closing section ever light up. It is exported as `useActiveHeading` for hosts that
  draw their own outline.
- The rail's motion is plain `transition-*` utilities, which the global reduced-motion reset in
  base.css neutralises — no animation engine. The panel's surface fades in as its own layer, so no
  border ever changes colour (FOC-14).
- The keyboard model is `useListNav`: the list is one tab stop, ↑/↓/Home/End move, Enter or Space
  navigates. Items are real `<a href="#id">` links, so copy-link and middle-click keep working; a
  plain click is intercepted and handed to `onNavigate`.
--- */

/** One heading in the outline — the same shape as `TextEdit`'s `TextEditOutlineItem`. */
export interface TableOfContentsItem {
  /** The heading element's `id` — `TextEdit` (`onOutlineChange`) and `MarkdownView` (`headingIds`) set it. */
  id: string;
  /** The heading level, `1` for `#`/`h1`. Indentation is relative to the shallowest level shown. */
  level: number;
  /** The heading's text. */
  text: string;
}

/** The two looks: an always-labelled list, or a rail of ticks that opens into the list. */
export type TableOfContentsVariant = "list" | "rail";

/** Options for `useActiveHeading`. */
export interface UseActiveHeadingOptions {
  /**
   * The element that scrolls the headings. Omit it to use the first heading's nearest scrolling
   * ancestor (an app shell's `main`, say), or the window when nothing between it and the page
   * scrolls.
   * @default undefined (the nearest scroller)
   */
  container?: React.RefObject<HTMLElement | null>;
  /**
   * The activation line, in px below the top edge of the container's visible box. A heading at or
   * above the line has been reached. Set it to your sticky header's height plus a little.
   * @default Math.min(180, 28% of the container's visible height)
   */
  offset?: number;
}

/** The activation line's cap, in px, and its share of the viewport — the reference's values. */
const ACTIVATION_MAX = 180;
const ACTIVATION_RATIO = 0.28;
/** How long a pointer rests on the rail before it opens, and lingers off it before it closes. */
const RAIL_OPEN_DELAY = 200;
const RAIL_CLOSE_DELAY = 120;
const ID_SEPARATOR = "\u0000";

/** The closest ancestor that scrolls vertically and has something to scroll; `null` for the page. */
function nearestScroller(element: HTMLElement): HTMLElement | null {
  const page = document.scrollingElement ?? document.documentElement;
  for (
    let parent = element.parentElement;
    parent && parent !== page && parent !== document.body;
    parent = parent.parentElement
  ) {
    if (
      /(auto|scroll|overlay)/.test(getComputedStyle(parent).overflowY) &&
      parent.scrollHeight - parent.clientHeight > 1
    )
      return parent;
  }
  return null;
}

/** The heading `ids` has reached, per the activation-line rule — `null` when none is in the DOM. */
function computeActiveHeading(
  ids: readonly string[],
  container: HTMLElement | null,
  offset: number | undefined,
): string | null {
  const headings = ids
    .map((id) => document.getElementById(id))
    .filter(
      (element): element is HTMLElement =>
        element !== null && element.getClientRects().length > 0,
    );
  const last = headings[headings.length - 1];
  if (!last) return null;

  const own = container ?? nearestScroller(headings[0]!);
  const scroller = own ?? document.scrollingElement ?? document.documentElement;
  const viewportTop = own ? own.getBoundingClientRect().top : 0;
  const viewportHeight = own ? own.clientHeight : window.innerHeight;
  const scrollable = scroller.scrollHeight - scroller.clientHeight > 1;
  const atBottom =
    Math.ceil(scroller.scrollTop + scroller.clientHeight) >=
    scroller.scrollHeight - 2;
  if (scrollable && atBottom) return last.id;

  const line =
    viewportTop +
    (offset ?? Math.min(ACTIVATION_MAX, viewportHeight * ACTIVATION_RATIO));
  let active = headings[0]!.id;
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= line) active = heading.id;
  }
  return active;
}

/**
 * `useActiveHeading` — the scroll spy `TableOfContents` runs, for hosts that draw their own
 * outline. Returns the id of the LAST heading whose top is at or above the activation line
 * (`offset`, by default `min(180px, 28%)` of the container's visible height below its top edge),
 * the first heading before any is reached, and the last heading once the container is scrolled to
 * its bottom. Headings are found with `document.getElementById`; the container defaults to the
 * first heading's nearest scrolling ancestor, else the window. Scroll is listened to on `window`
 * in the capture phase, so a nested scroller counts, and throttled to one read per frame;
 * it re-reads when `ids` change and on resize.
 *
 * @example
 * const activeId = useActiveHeading(outline.map((item) => item.id), { container: scrollerRef });
 */
export function useActiveHeading(
  ids: readonly string[],
  { container, offset }: UseActiveHeadingOptions = {},
): string | null {
  const [active, setActive] = React.useState<string | null>(null);
  // One string, so a new array with the same ids does not restart the listeners.
  const key = ids.join(ID_SEPARATOR);

  React.useEffect(() => {
    const list = key ? key.split(ID_SEPARATOR) : [];
    if (list.length === 0) {
      setActive(null);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = computeActiveHeading(
        list,
        container?.current ?? null,
        offset,
      );
      setActive((current) => (current === next ? current : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // Headings can land a frame after their outline (an editor mounting its document).
    schedule();
    window.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [key, container, offset]);

  return active;
}

/** Props for `TableOfContents`. */
export interface TableOfContentsProps extends Omit<
  React.ComponentPropsWithRef<"nav">,
  "children"
> {
  /** The headings, in document order — `TextEdit`'s `onOutlineChange` items as they come. */
  items: readonly TableOfContentsItem[];
  /**
   * Called when an item is chosen — a click, or Enter/Space on the focused item. Scroll there
   * yourself (`handle.scrollToHeading(id)`). When omitted, the heading `document.getElementById(id)`
   * is scrolled to the top of its scroller — smoothly, or instantly under reduced motion; give it a
   * `scroll-margin-top` to clear a sticky header. Modified clicks (new tab, copy link) are left to
   * the browser.
   * @default undefined
   */
  onNavigate?: (id: string) => void;
  /**
   * The active heading, controlled. Omit it and the built-in scroll spy decides; `null` marks
   * none.
   * @default undefined
   */
  activeId?: string | null;
  /**
   * Called with the heading the scroll spy has reached, whenever that changes — pair it with
   * `activeId` to control the active item.
   * @default undefined
   */
  onActiveIdChange?: (id: string | null) => void;
  /**
   * The element that scrolls the headings, for the scroll spy. Omit it to use the first heading's
   * nearest scrolling ancestor, or the window when the page itself scrolls.
   * @default undefined (the nearest scroller)
   */
  scrollContainer?: React.RefObject<HTMLElement | null>;
  /**
   * `list` is an always-labelled, indented list. `rail` is a column of short ticks (their width
   * follows the level, the active one is thicker) that opens into the labelled list on hover or
   * keyboard focus, over the content beside it.
   * @default "list"
   */
  variant?: TableOfContentsVariant;
  /**
   * Stick to the top of the scroller, at `--table-of-contents-top` (zero by default; set it through
   * `className`, e.g. `[--table-of-contents-top:--spacing(14)]` for a 56px header), and scroll
   * within `100dvh` minus that offset.
   * @default true
   */
  sticky?: boolean;
  /**
   * The shallowest heading level shown.
   * @default 1
   */
  minLevel?: number;
  /**
   * The deepest heading level shown.
   * @default 3
   */
  maxLevel?: number;
  /**
   * The navigation's accessible name and its visible title (the list's heading, the rail's open
   * panel, the sheet's title).
   * @default "On this page"
   */
  label?: string;
  /**
   * Show the outline in a `Sheet` (side left) opened by this element instead of inline — for
   * narrow screens. Choosing an item closes the sheet, then calls `onNavigate`. `variant` and
   * `sticky` do not apply; `ref` and `className` reach the list's `nav` inside the sheet.
   * @default undefined
   */
  trigger?: React.ReactElement;
}

// The offset is declared here, at zero, so an unset one is a decision rather than a dropped
// declaration; a host's `className` spelling of the same property wins through `cn`.
const STICKY =
  "sticky top-(--table-of-contents-top) self-start [--table-of-contents-top:--spacing(0)]";
const STICKY_MAX_HEIGHT = "max-h-[calc(100dvh-var(--table-of-contents-top))]";

/**
 * `TableOfContents` — the "On this page" outline of a long document: links to its headings, the
 * one the reader has reached marked (`aria-current="location"`, a bar or a thicker tick, and
 * weight — never colour alone). A `list`, a `rail` of ticks that opens on hover or focus, or —
 * with `trigger` — a left `Sheet` for narrow screens. Renders nothing when no heading is in range.
 *
 * Wide and narrow are two instances the host shows by breakpoint: the inline one in a
 * `hidden lg:block` column, the `trigger` one in the header with `lg:hidden`.
 *
 * @example
 * <TableOfContents
 *   variant="rail"
 *   items={outline}
 *   onNavigate={(id) => handle.current?.scrollToHeading(id)}
 * />
 */
export function TableOfContents({
  items,
  minLevel = 1,
  maxLevel = 3,
  trigger,
  label = "On this page",
  onNavigate,
  ...props
}: TableOfContentsProps) {
  const shown = React.useMemo(
    () =>
      items.filter((item) => item.level >= minLevel && item.level <= maxLevel),
    [items, minLevel, maxLevel],
  );
  const reducedMotion = usePrefersReducedMotion();
  const navigate = React.useCallback(
    (id: string) => {
      if (onNavigate) {
        onNavigate(id);
        return;
      }
      document.getElementById(id)?.scrollIntoView({
        block: "start",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [onNavigate, reducedMotion],
  );

  if (shown.length === 0) return null;
  if (trigger)
    return (
      <TableOfContentsSheet
        {...props}
        items={shown}
        label={label}
        trigger={trigger}
        navigate={navigate}
      />
    );
  return (
    <TableOfContentsNav
      {...props}
      items={shown}
      label={label}
      navigate={navigate}
    />
  );
}

interface TableOfContentsNavProps extends Omit<
  TableOfContentsProps,
  "trigger" | "minLevel" | "maxLevel" | "onNavigate" | "label"
> {
  label: string;
  navigate: (id: string) => void;
  /** The sheet names the list with its own title. */
  showTitle?: boolean;
}

function TableOfContentsNav({
  items,
  navigate,
  activeId: activeIdProp,
  onActiveIdChange,
  scrollContainer,
  variant = "list",
  sticky = true,
  label,
  showTitle = true,
  className,
  ...props
}: TableOfContentsNavProps) {
  const titleId = React.useId();
  const listRef = React.useRef<HTMLOListElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const rail = variant === "rail";

  const ids = React.useMemo(() => items.map((item) => item.id), [items]);
  const spied = useActiveHeading(ids, { container: scrollContainer });
  const reported = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (spied === reported.current) return;
    reported.current = spied;
    onActiveIdChange?.(spied);
  }, [spied, onActiveIdChange]);
  const activeId = activeIdProp !== undefined ? activeIdProp : spied;
  const activeIndex = items.findIndex((item) => item.id === activeId);

  const listNav = useListNav({
    count: items.length,
    defaultActiveIndex: Math.max(activeIndex, 0),
  });
  const { setActiveIndex } = listNav;
  // Tabbing in lands on the active heading: keep the roving stop on it while focus is elsewhere.
  React.useEffect(() => {
    if (activeIndex < 0) return;
    if (listRef.current?.contains(document.activeElement)) return;
    setActiveIndex(activeIndex);
  }, [activeIndex, setActiveIndex]);

  // Keep the active item in view when the outline itself scrolls — without scrolling the page.
  React.useEffect(() => {
    const scroller = rail
      ? scrollerRef.current
      : listRef.current?.parentElement;
    const link = listRef.current?.querySelector<HTMLElement>(
      '[data-slot="table-of-contents-link"][data-active]',
    );
    if (!scroller || !link || scroller.scrollHeight <= scroller.clientHeight)
      return;
    const box = scroller.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    if (target.top < box.top) scroller.scrollTop -= box.top - target.top;
    else if (target.bottom > box.bottom)
      scroller.scrollTop += target.bottom - box.bottom;
  }, [activeId, rail]);

  const [expanded, setExpanded] = React.useState(false);
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const clearTimers = React.useCallback(() => {
    for (const timer of [openTimer, closeTimer]) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  React.useEffect(() => clearTimers, [clearTimers]);
  const later = (
    timer: React.RefObject<number | null>,
    delay: number,
    next: boolean,
  ) => {
    clearTimers();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setExpanded(next);
    }, delay);
  };
  const keyboardFocusWithin = (element: HTMLElement) => {
    const focused = element.ownerDocument.activeElement;
    if (!focused || !element.contains(focused)) return false;
    try {
      return focused.matches(":focus-visible");
    } catch {
      return true;
    }
  };

  const choose = (id: string) => {
    if (rail) {
      clearTimers();
      setExpanded(false);
    }
    navigate(id);
  };

  const depthBase = Math.min(...items.map((item) => item.level));
  const list = (
    <ol
      ref={listRef}
      data-slot="table-of-contents-list"
      onKeyDown={listNav.handleKeyDown}
      className={cn("flex flex-col", !rail && "border-s border-border")}
    >
      {items.map((item, index) => {
        const active = item.id === activeId;
        const depth = item.level - depthBase;
        return (
          <li
            key={item.id}
            data-slot="table-of-contents-item"
            data-level={item.level}
            data-active={active ? "" : undefined}
            style={
              { "--table-of-contents-depth": depth } as React.CSSProperties
            }
          >
            <a
              href={`#${item.id}`}
              {...listNav.getItemProps(index)}
              data-slot="table-of-contents-link"
              data-active={active ? "" : undefined}
              aria-current={active ? "location" : undefined}
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                choose(item.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== " ") return;
                event.preventDefault();
                choose(item.id);
              }}
              className={rail ? RAIL_LINK : LIST_LINK}
            >
              {rail ? (
                <span
                  aria-hidden
                  data-slot="table-of-contents-tick"
                  className="flex w-4 shrink-0 items-center"
                >
                  <span
                    className={cn(
                      "h-0.5 rounded-full bg-muted-foreground/40 transition-colors group-hover/table-of-contents-link:bg-muted-foreground group-data-active/table-of-contents-link:h-1 group-data-active/table-of-contents-link:bg-foreground",
                      depth === 0 ? "w-4" : depth === 1 ? "w-3" : "w-2",
                    )}
                  />
                </span>
              ) : null}
              <span
                data-slot="table-of-contents-label"
                className={
                  rail
                    ? "min-w-0 flex-1 truncate ps-[calc(var(--table-of-contents-depth,0)*--spacing(3))] opacity-0 transition-opacity duration-150 group-data-expanded/table-of-contents:opacity-100"
                    : "min-w-0"
                }
              >
                {item.text}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  const title = showTitle ? (
    <p
      id={titleId}
      data-slot="table-of-contents-title"
      className={cn(
        "flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground",
        rail ? "h-7 px-1" : "pb-1",
      )}
    >
      <ListTree aria-hidden className={rail ? "size-4 shrink-0" : "size-3.5"} />
      <span
        className={cn(
          "min-w-0 truncate",
          rail &&
            "opacity-0 transition-opacity duration-150 group-data-expanded/table-of-contents:opacity-100",
        )}
      >
        {label}
      </span>
    </p>
  ) : null;
  const naming = showTitle
    ? { "aria-labelledby": titleId }
    : { "aria-label": label };

  if (!rail)
    return (
      <nav
        {...naming}
        data-slot="table-of-contents"
        data-variant="list"
        className={cn(
          "flex min-w-0 flex-col gap-2",
          sticky && [
            STICKY,
            STICKY_MAX_HEIGHT,
            "overflow-y-auto overscroll-contain",
          ],
          className,
        )}
        {...props}
      >
        {title}
        {list}
      </nav>
    );

  return (
    <nav
      {...naming}
      data-slot="table-of-contents"
      data-variant="rail"
      data-expanded={expanded ? "" : undefined}
      className={cn(
        // `z-20`: the open panel is an overlay, so it paints over the page's own positioned
        // content (the title, the editor), never under it.
        "group/table-of-contents relative z-20 w-6 shrink-0",
        sticky && STICKY,
        className,
      )}
      {...props}
    >
      <div
        data-slot="table-of-contents-panel"
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          if (expanded) clearTimers();
          else later(openTimer, RAIL_OPEN_DELAY, true);
        }}
        onPointerLeave={(event) => {
          if (keyboardFocusWithin(event.currentTarget)) return;
          later(closeTimer, RAIL_CLOSE_DELAY, false);
        }}
        onFocus={(event) => {
          if (!keyboardFocusWithin(event.currentTarget)) return;
          clearTimers();
          setExpanded(true);
        }}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null))
            return;
          later(closeTimer, RAIL_CLOSE_DELAY, false);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !expanded) return;
          clearTimers();
          setExpanded(false);
        }}
        className={cn(
          "relative z-10 flex w-6 flex-col transition-[width] duration-200 ease-out group-data-expanded/table-of-contents:w-64",
          sticky && STICKY_MAX_HEIGHT,
        )}
      >
        <div
          aria-hidden
          data-slot="table-of-contents-surface"
          className="pointer-events-none absolute inset-0 rounded-lg border border-border bg-popover opacity-0 shadow-md transition-opacity duration-150 group-data-expanded/table-of-contents:opacity-100"
        />
        <div
          ref={scrollerRef}
          className="relative flex min-h-0 flex-col gap-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          {title}
          {list}
        </div>
      </div>
    </nav>
  );
}

// A row is 28px tall in both variants and at least 24px wide, so the link itself is the ≥24px
// target (WCAG 2.5.8) with room around it, and needs no invisible hit area.
const LIST_LINK =
  "group/table-of-contents-link relative -ms-px flex min-h-7 items-center rounded-e-md py-1 ps-[calc(--spacing(3)+var(--table-of-contents-depth,0)*--spacing(3))] pe-2 text-sm text-muted-foreground transition-colors before:absolute before:inset-y-1 before:start-0 before:w-0.5 before:rounded-full before:bg-foreground before:opacity-0 before:content-[''] hover:text-foreground data-active:font-medium data-active:text-foreground data-active:before:opacity-100";
const RAIL_LINK =
  "group/table-of-contents-link flex h-7 min-w-6 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground data-active:font-medium data-active:text-foreground";

interface TableOfContentsSheetProps extends Omit<
  TableOfContentsProps,
  "minLevel" | "maxLevel" | "onNavigate" | "label" | "trigger"
> {
  label: string;
  trigger: React.ReactElement;
  navigate: (id: string) => void;
}

function TableOfContentsSheet({
  trigger,
  label,
  navigate,
  variant: _variant,
  sticky: _sticky,
  ...props
}: TableOfContentsSheetProps) {
  const [open, setOpen] = React.useState(false);
  // Navigate once the sheet has closed: a modal sheet locks the page's scroll while it is open.
  const pending = React.useRef<string | null>(null);
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (next || pending.current === null) return;
        const id = pending.current;
        pending.current = null;
        navigate(id);
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent side="left" size="sm">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <SheetBody className="pb-4">
          <TableOfContentsNav
            {...props}
            variant="list"
            sticky={false}
            label={label}
            showTitle={false}
            navigate={(id) => {
              pending.current = id;
              setOpen(false);
            }}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
