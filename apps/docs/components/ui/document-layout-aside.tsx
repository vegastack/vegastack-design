// @vegastack document-layout@0.25.102 sha256-pE2EY3KeX5leR3XBsqarVYG4W9grWPmso8mVKNyPkCY=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetAction,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentLayoutTier } from "@/components/ui/use-document-layout-tier";

/* ------------------------------------------------------------------------------------------------
 * DocumentLayoutAside — the rail after the text: the discussion (comments) or the pinned outline.
 *
 * It sits in the layout's end track, which `DocumentLayout aside` keeps open or closed, so the text
 * never moves when the rail opens. Which kind shows is the layout's `aside`; this part reads it
 * from the grid it sits in (a data attribute, so the layout itself stays server-safe), together
 * with the tier. Below the L tier the discussion is a bottom sheet (the whole screen on a phone),
 * opened while the layout's `aside` is `"discussion"`; the outline shows from XL only.
 * ----------------------------------------------------------------------------------------------*/

/** One tab of the aside: its label, an optional count beside it, and what it shows. */
export interface DocumentLayoutAsideTab {
  /** Stable value — the tab's id ("open", "resolved", "page", "review"). */
  value: string;
  /** The tab's label ("Open"). */
  label: React.ReactNode;
  /** A count after the label ("3"); none when unset. @default undefined */
  count?: number;
  /** The tab's panel. */
  content: React.ReactNode;
}

/** Props accepted by `DocumentLayoutAside`. */
export interface DocumentLayoutAsideProps extends Omit<
  React.ComponentPropsWithRef<"aside">,
  "title" | "defaultValue" | "children"
> {
  /**
   * Which aside this is: `discussion` (the comments rail; a bottom sheet below the L tier) or
   * `outline` (the contents, pinned from the XL tier). It shows while `DocumentLayout`'s `aside`
   * names it.
   * @default "discussion"
   */
  kind?: "discussion" | "outline";
  /**
   * The heading, and the region's name. The outline shows no heading unless one is given (its
   * `TableOfContents` carries its own title); its region is still named.
   * @default "Comments" (discussion), "On this page" (outline)
   */
  title?: string;
  /** A count after the title — the open threads. @default undefined */
  count?: number;
  /**
   * Tabs under the heading, in order — Open · Resolved · Page, and Review while a review is open.
   * Without tabs the aside shows `children`.
   * @default undefined
   */
  tabs?: readonly DocumentLayoutAsideTab[];
  /** The selected tab, controlled. Pair with `onValueChange`. @default undefined */
  value?: string;
  /** The tab selected first, uncontrolled. @default the first tab */
  defaultValue?: string;
  /** Called when the reader picks a tab. @default undefined */
  onValueChange?: (value: string) => void;
  /**
   * Close the aside (set the layout's `aside` to `null`): a × in the heading, and the sheet's
   * own close below L. Without it the aside has no close control.
   * @default undefined
   */
  onClose?: () => void;
  /** The × button's name. @default "Close" */
  closeLabel?: string;
  /** What the aside shows when it has no `tabs`. @default undefined */
  children?: React.ReactNode;
}

const DEFAULT_TITLE = { discussion: "Comments", outline: "On this page" };
const GRID = "[data-slot=document-layout-grid]";

/** The layout's `aside` (`data-aside` on the grid around `ref`), kept current. */
function useLayoutAside(ref: React.RefObject<HTMLElement | null>) {
  const [aside, setAside] = React.useState<string | null>(null);
  React.useLayoutEffect(() => {
    const grid = ref.current?.closest<HTMLElement>(GRID);
    if (!grid) return;
    const read = () => setAside(grid.dataset.aside ?? null);
    read();
    const observer = new MutationObserver(read);
    observer.observe(grid, {
      attributes: true,
      attributeFilter: ["data-aside"],
    });
    return () => observer.disconnect();
  }, [ref]);
  return aside;
}

/**
 * `DocumentLayoutAside` — the rail after the text, in the track `DocumentLayout aside` keeps for
 * it: `kind="discussion"` is the comments rail (a heading with its `count` and a ×, `tabs` such as
 * Open · Resolved · Page · Review, the selected tab's panel scrolling inside a rail as tall as the
 * window); `kind="outline"` is the contents list, pinned from the XL tier while the discussion is
 * closed. It shows while the layout's `aside` names its kind. Non-modal: the page stays readable
 * and editable beside it. Below the L tier the discussion opens as a bottom sheet instead (the
 * whole screen below 640px), and `onClose` closes it.
 *
 * @example
 * <DocumentLayout aside={discussionOpen ? "discussion" : null}>
 *   …
 *   <DocumentLayoutAside kind="discussion" count={open.length} onClose={() => setDiscussionOpen(false)}
 *     tabs={[
 *       { value: "open", label: "Open", count: open.length, content: <OpenThreads /> },
 *       { value: "resolved", label: "Resolved", content: <ResolvedThreads /> },
 *       { value: "page", label: "Page", content: <PageThread /> },
 *     ]} />
 * </DocumentLayout>
 */
export function DocumentLayoutAside({
  kind = "discussion",
  title,
  count,
  tabs,
  value: valueProp,
  defaultValue,
  onValueChange,
  onClose,
  closeLabel = "Close",
  children,
  className,
  ref,
  "aria-label": ariaLabel,
  ...props
}: DocumentLayoutAsideProps) {
  const anchor = React.useRef<HTMLElement>(null);
  const mergedRef = React.useMemo(() => mergeRefs(ref, anchor), [ref]);
  const tier = useDocumentLayoutTier(anchor);
  const asideState = useLayoutAside(anchor);
  const heading = title ?? DEFAULT_TITLE[kind];
  // The outline's list carries its own title ("On this page"): the aside adds one only when asked.
  const showHeading = kind === "discussion" || title !== undefined;
  // Below L the discussion is a sheet; the outline has no sheet (the contents rail's own list
  // serves there).
  const inline =
    kind === "outline" || tier === "l" || tier === "xl" || tier === "2xl";
  const sheetOpen = !inline && asideState === kind;

  const [innerValue, setInnerValue] = React.useState(
    () => defaultValue ?? tabs?.[0]?.value,
  );
  const wanted = valueProp ?? innerValue;
  const value = tabs?.some((tab) => tab.value === wanted)
    ? wanted
    : tabs?.[0]?.value;

  const body = tabs?.length ? (
    <Tabs
      value={value}
      onValueChange={(next) => {
        const picked = String(next);
        if (valueProp === undefined) setInnerValue(picked);
        onValueChange?.(picked);
      }}
      data-slot="document-layout-aside-tabs"
      className="min-h-0 flex-1 gap-0"
    >
      {/* The spacing sits on a wrapper: each tab keeps its full 32px target. */}
      <div data-slot="document-layout-aside-tablist" className="shrink-0 px-2">
        <TabsList variant="line" aria-label={heading}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {tab.count !== undefined ? " " : null}
              {tab.count !== undefined ? (
                <span
                  data-slot="document-layout-aside-tab-count"
                  className="text-muted-foreground tabular-nums"
                >
                  {tab.count}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          data-slot="document-layout-aside-panel"
          className="min-h-0 overflow-y-auto overscroll-contain p-3"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  ) : (
    <div
      data-slot="document-layout-aside-body"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
    >
      {children}
    </div>
  );

  const countText =
    count !== undefined ? (
      <span
        data-slot="document-layout-aside-count"
        className="text-muted-foreground tabular-nums"
      >
        {count}
      </span>
    ) : null;

  return (
    <>
      <aside
        ref={mergedRef}
        data-slot="document-layout-aside"
        data-kind={kind}
        aria-label={ariaLabel ?? heading}
        className={cn(
          // The end track (`DocumentLayout aside` keeps it), as tall as the page, its 2rem gap
          // inside it; shown only while the layout's `aside` names this kind.
          "relative col-[margin] row-[1/span_3] hidden min-w-0 ps-8 print:hidden",
          kind === "discussion"
            ? "@min-[64rem]/document-layout:in-data-[aside=discussion]:block"
            : "@min-[90rem]/document-layout:in-data-[aside=outline]:block",
          className,
        )}
        {...props}
      >
        {inline ? (
          <div
            data-slot="document-layout-aside-panel-frame"
            className={cn(
              "sticky top-(--document-layout-sticky-top) flex min-w-0 flex-col",
              kind === "discussion"
                ? // A rail as tall as the window (less the bar above and the sticky offsets).
                  "h-[calc(100dvh-var(--document-layout-aside-offset))] overflow-hidden rounded-xl border border-border bg-card text-card-foreground"
                : "max-h-[calc(100dvh-var(--document-layout-aside-offset))]",
            )}
          >
            <div
              data-slot="document-layout-aside-header"
              className={cn(
                "flex shrink-0 items-center gap-2",
                showHeading ? "min-h-11" : "absolute end-0 top-2 z-10",
                kind === "discussion" ? "ps-4 pe-2" : "ps-3 pe-1",
              )}
            >
              {showHeading ? (
                <h2 className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm font-medium">
                  <span className="truncate">{heading}</span>
                  {countText ? " " : null}
                  {countText}
                </h2>
              ) : null}
              {onClose ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={closeLabel}
                  onClick={onClose}
                  data-slot="document-layout-aside-close"
                  className="text-muted-foreground"
                >
                  <XIcon aria-hidden />
                </Button>
              ) : null}
            </div>
            {body}
          </div>
        ) : null}
      </aside>
      {kind === "discussion" && !inline ? (
        <Sheet
          open={sheetOpen}
          onOpenChange={(next) => {
            if (!next) onClose?.();
          }}
        >
          <SheetContent
            side="bottom"
            // The × sits in the header, inside the padding that clears the status bar.
            showCloseButton={false}
            data-slot="document-layout-aside-sheet"
            className={cn(
              "gap-0 p-0 data-[side=bottom]:h-[70dvh]",
              // The whole screen on a phone, clear of the status bar.
              "data-[side=bottom]:max-sm:h-dvh data-[side=bottom]:max-sm:max-h-dvh data-[side=bottom]:max-sm:border-t-0 data-[side=bottom]:max-sm:pt-[env(safe-area-inset-top)]",
            )}
          >
            <SheetHeader className="items-center pb-2">
              <SheetTitle className="flex items-baseline gap-1.5">
                {heading}
                {countText ? " " : null}
                {countText}
              </SheetTitle>
              {onClose ? (
                // It is the sheet's only close: no corner × to leave room for.
                <SheetAction className="me-0 self-center">
                  <SheetClose
                    data-slot="document-layout-aside-close"
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={closeLabel}
                        className="-me-1 text-muted-foreground"
                      />
                    }
                  >
                    <XIcon aria-hidden />
                  </SheetClose>
                </SheetAction>
              ) : null}
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
