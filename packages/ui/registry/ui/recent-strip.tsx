// @vegastack recent-strip@0.25.95 sha256-pMUEKTGAmmAelgam7HGQyGBkFXou5L66RNU/uvKyOAM=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn } from "@vegastack/design";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useListNav } from "@/components/ui/use-list-nav";
import { usePrefersReducedMotion } from "@/components/ui/use-media-query";

/** One record in a `RecentStrip`. */
export interface RecentStripItem {
  /** Stable key. @default the item's `href` */
  id?: string;
  /** Where the card goes — rendered through `linkRender` (default `<a />`). */
  href: string;
  /** The record's kind as a glyph (decorative). */
  icon?: React.ReactNode;
  /** The record's name — the link's accessible name. */
  title: string;
  /**
   * One quiet line under the title on a card ("Page · 2h ago") — plain text, since the whole card
   * is one link; it describes the link and is hidden on the phone's chips.
   */
  meta?: string;
}

/** Props accepted by `RecentStrip`. */
export interface RecentStripProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "children"
> {
  /**
   * The records, most recent first. Only the first `max` render.
   * @default []
   */
  items?: RecentStripItem[];
  /**
   * The most cards the strip shows.
   * @default 6
   */
  max?: number;
  /**
   * The strip's heading — and the toggle's name when it is `collapsible`.
   * @default "Recent"
   */
  label?: string;
  /**
   * The heading element (`<h3 />` under an `h2` section). Its children are the label (or the
   * toggle).
   * @default <h2 />
   */
  headingRender?: React.ReactElement;
  /**
   * The heading becomes a toggle that folds the strip away to its heading row.
   * @default false
   */
  collapsible?: boolean;
  /**
   * Whether a collapsible strip is open (controlled). Pair with `onOpenChange`.
   * @default undefined
   */
  open?: boolean;
  /**
   * Whether a collapsible strip starts open (uncontrolled).
   * @default true
   */
  defaultOpen?: boolean;
  /**
   * Called when the toggle opens or folds the strip — persist it to remember the choice.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The element each card renders as — a router link (`<Link />`); it receives `href`, the card's
   * classes and its content.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * Shows skeleton cards of the same shape (the heading stays) while the records load.
   * @default false
   */
  loading?: boolean;
  /**
   * What to show under the heading when there are no records. Without it an empty strip renders
   * nothing at all.
   * @default undefined
   */
  emptyState?: React.ReactNode;
  /**
   * The name of the mouse-only button that scrolls back.
   * @default "Scroll back"
   */
  scrollBackLabel?: string;
  /**
   * The name of the mouse-only button that scrolls forward.
   * @default "Scroll forward"
   */
  scrollForwardLabel?: string;
}

const STRIP_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

/** Shared card/chip geometry: a chip on a narrow strip, a two-line card from 28rem of its width. */
const ITEM_SHAPE =
  "flex max-w-48 min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 @max-md/recent-strip:h-8 @md/recent-strip:w-56 @md/recent-strip:max-w-none @md/recent-strip:gap-2.5 @md/recent-strip:rounded-lg @md/recent-strip:px-3 @md/recent-strip:py-2";

/**
 * `RecentStrip` — one row of the records a person opened last, to jump back in: a horizontal strip
 * of compact cards (icon tile · title · one meta line) that scrolls sideways with edge fades and,
 * on a fine pointer, ◂ ▸ buttons at the ends. On a narrow strip (under 28rem of its own width — a
 * phone) the cards become a single line of chips. The strip is one Tab stop: ←/→ move between
 * cards, Home/End jump to the ends. `collapsible` turns the heading into a toggle; `loading` shows
 * skeleton cards of the same shape; with no records the strip renders nothing, or `emptyState`.
 * Links are framework-agnostic through `linkRender`.
 *
 * @example
 * <RecentStrip
 *   label="Recent"
 *   collapsible
 *   linkRender={<Link href="" />}
 *   items={recents.map((r) => ({
 *     href: r.href,
 *     icon: <FileText />,
 *     title: r.title,
 *     meta: `Page · ${formatAgo(r.viewedAt)}`,
 *   }))}
 * />
 */
export function RecentStrip({
  items = [],
  max = 6,
  label = "Recent",
  headingRender,
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  linkRender,
  loading = false,
  emptyState,
  scrollBackLabel = "Scroll back",
  scrollForwardLabel = "Scroll forward",
  className,
  ...props
}: RecentStripProps) {
  const headingId = React.useId();
  const shown = items.slice(0, Math.max(0, max));
  const empty = !loading && shown.length === 0;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = collapsible ? (open ?? uncontrolledOpen) : true;

  if (empty && emptyState === undefined) return null;

  const body = loading ? (
    <RecentStripSkeleton count={Math.max(1, Math.min(max, 6))} />
  ) : empty ? (
    <div
      data-slot="recent-strip-empty"
      className="text-sm text-muted-foreground"
    >
      {emptyState}
    </div>
  ) : (
    <RecentStripList
      items={shown}
      label={label}
      linkRender={linkRender}
      scrollBackLabel={scrollBackLabel}
      scrollForwardLabel={scrollForwardLabel}
    />
  );

  const headingClass =
    "flex min-w-0 items-center text-sm font-medium text-muted-foreground";

  return (
    <section
      data-slot="recent-strip"
      data-state={isOpen ? "open" : "closed"}
      data-loading={loading ? "" : undefined}
      aria-labelledby={headingId}
      aria-busy={loading || undefined}
      className={cn(
        "@container/recent-strip flex min-w-0 flex-col gap-2",
        className,
      )}
      {...props}
    >
      {collapsible ? (
        <Collapsible
          open={isOpen}
          onOpenChange={(next) => {
            if (open === undefined) setUncontrolledOpen(next);
            onOpenChange?.(next);
          }}
          className="flex min-w-0 flex-col gap-2"
        >
          {React.cloneElement(
            headingRender ?? <h2 />,
            mergeProps((headingRender?.props ?? {}) as object, {
              "data-slot": "recent-strip-heading",
              className: headingClass,
              children: (
                <CollapsibleTrigger
                  data-slot="recent-strip-toggle"
                  id={headingId}
                  className="-ms-1 inline-flex h-7 min-w-0 items-center gap-1 rounded-md px-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  <span className="truncate">{label}</span>
                  <ChevronDown
                    aria-hidden
                    className="transition-transform duration-200 in-aria-[expanded=false]:-rotate-90 rtl:in-aria-[expanded=false]:rotate-90"
                  />
                </CollapsibleTrigger>
              ),
            }) as object,
          )}
          <CollapsibleContent data-slot="recent-strip-content">
            {body}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          {React.cloneElement(
            headingRender ?? <h2 />,
            mergeProps((headingRender?.props ?? {}) as object, {
              "data-slot": "recent-strip-heading",
              id: headingId,
              className: headingClass,
              children: <span className="truncate">{label}</span>,
            }) as object,
          )}
          {body}
        </>
      )}
    </section>
  );
}

function RecentStripList({
  items,
  label,
  linkRender,
  scrollBackLabel,
  scrollForwardLabel,
}: {
  items: RecentStripItem[];
  label: string;
  linkRender?: React.ReactElement;
  scrollBackLabel: string;
  scrollForwardLabel: string;
}) {
  const nav = useListNav({ count: items.length });
  const metaId = React.useId();
  const reducedMotion = usePrefersReducedMotion();
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const [edges, setEdges] = React.useState({ start: false, end: false });

  const measure = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    // `scrollLeft` runs negative in a right-to-left strip; its distance from the start is the same.
    const from = Math.abs(list.scrollLeft);
    const room = list.scrollWidth - list.clientWidth;
    const next = { start: from > 1, end: room - from > 1 };
    setEdges((prev) =>
      prev.start === next.start && prev.end === next.end ? prev : next,
    );
  }, []);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure, items]);

  const scroll = (direction: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;
    const rtl = getComputedStyle(list).direction === "rtl";
    list.scrollBy({
      left: direction * (rtl ? -1 : 1) * list.clientWidth * 0.8,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div
      data-slot="recent-strip-viewport"
      className="relative min-w-0 shrink-0"
    >
      <ul
        ref={listRef}
        data-slot="recent-strip-list"
        aria-label={label}
        onScroll={measure}
        onKeyDown={(event) => {
          if (STRIP_KEYS.has(event.key)) nav.handleKeyDown(event);
        }}
        className="flex min-w-0 snap-x gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-fade-x scrollbar-none"
      >
        {items.map((item, index) => {
          const itemProps = nav.getItemProps(index);
          return (
            <li
              key={item.id ?? item.href}
              data-slot="recent-strip-item"
              className="flex shrink-0 snap-start"
            >
              {React.cloneElement(
                linkRender ?? <a />,
                mergeProps((linkRender?.props ?? {}) as object, {
                  href: item.href,
                  // A clipped title stays readable on hover; its name is always whole.
                  title: item.title,
                  ...itemProps,
                  // The title names the link; the meta line describes it, so the name stays
                  // the record's own however the two lines lay out.
                  "aria-describedby": item.meta
                    ? `${metaId}-${index}`
                    : undefined,
                  "data-slot": "recent-strip-link",
                  className: cn(
                    ITEM_SHAPE,
                    "text-foreground no-underline transition-colors hover:bg-accent hover:no-underline focus-visible:no-underline",
                  ),
                  children: (
                    <>
                      {item.icon ? (
                        <span
                          data-slot="recent-strip-icon"
                          aria-hidden="true"
                          className="flex shrink-0 items-center justify-center text-muted-foreground @md/recent-strip:size-8 @md/recent-strip:rounded-md @md/recent-strip:bg-muted [&_svg]:size-4 [&_svg]:shrink-0"
                        >
                          {item.icon}
                        </span>
                      ) : null}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span
                          data-slot="recent-strip-title"
                          className="truncate text-sm font-medium"
                        >
                          {item.title}
                        </span>
                        {item.meta ? (
                          <span
                            data-slot="recent-strip-meta"
                            id={`${metaId}-${index}`}
                            aria-hidden="true"
                            className="hidden truncate text-xs text-muted-foreground @md/recent-strip:block"
                          >
                            {item.meta}
                          </span>
                        ) : null}
                      </span>
                    </>
                  ),
                }) as object,
              )}
            </li>
          );
        })}
      </ul>
      {/* Mouse-only: the keyboard has ←/→ and a touch screen swipes, so both stay out of the tab
          order and the accessibility tree. */}
      <Button
        data-slot="recent-strip-scroll-start"
        data-visible={edges.start ? "" : undefined}
        variant="outline"
        size="icon-xs"
        tabIndex={-1}
        aria-hidden="true"
        aria-label={scrollBackLabel}
        onClick={() => scroll(-1)}
        className="absolute start-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-background pointer-fine:data-visible:inline-flex dark:bg-background dark:hover:bg-muted"
      >
        <ChevronLeft className="rtl:rotate-180" />
      </Button>
      <Button
        data-slot="recent-strip-scroll-end"
        data-visible={edges.end ? "" : undefined}
        variant="outline"
        size="icon-xs"
        tabIndex={-1}
        aria-hidden="true"
        aria-label={scrollForwardLabel}
        onClick={() => scroll(1)}
        className="absolute end-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-background pointer-fine:data-visible:inline-flex dark:bg-background dark:hover:bg-muted"
      >
        <ChevronRight className="rtl:rotate-180" />
      </Button>
    </div>
  );
}

function RecentStripSkeleton({ count }: { count: number }) {
  return (
    <div
      data-slot="recent-strip-skeleton"
      aria-hidden="true"
      className="flex min-w-0 shrink-0 gap-2 overflow-hidden"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            ITEM_SHAPE,
            "w-28 shrink-0 @md/recent-strip:w-56 @md/recent-strip:py-2",
          )}
        >
          <Skeleton className="size-4 shrink-0 rounded-full @md/recent-strip:size-8 @md/recent-strip:rounded-md" />
          <span className="flex min-w-0 flex-1 flex-col">
            {/* The loaded card's two line boxes (20px and 16px), so nothing moves on arrival. */}
            <span className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-4/5" />
            </span>
            <span className="hidden h-4 items-center @md/recent-strip:flex">
              <Skeleton className="h-3 w-1/2" />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
