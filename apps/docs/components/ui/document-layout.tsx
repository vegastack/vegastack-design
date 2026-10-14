// @vegastack document-layout@0.25.35 sha256-iObfG1omGenLy4oDMpVQHRV07IPw40YoOSaGpJ2zfss=

import * as React from "react";
import { cn } from "@vegastack/design";
import { Skeleton } from "@/components/ui/skeleton";

// The tier hook is the one client leaf; it lives in its own file so this one stays server-safe.
export { useDocumentLayoutTier } from "@/components/ui/use-document-layout-tier";

/* ------------------------------------------------------------------------------------------------
 * DocumentLayout — a page read as a document: the title area, the text at a reading measure, what
 * follows the text (sub-pages, page comments), a contents list beside it and a comment margin on
 * the other side. One grid, four tiers by its OWN width (container queries in rem, so a collapsed
 * sidebar or a split view picks the right one), and one subtree at every width: a column that has
 * no room is `display: none`, never unmounted, so an editor inside never remounts.
 *
 *   S  < 36rem   text only, full width             (contents and comments are the host's sheet)
 *   M  36–52rem  contents rail · text              (comments: a popover at the highlight)
 *   L  52–64rem  contents rail · text · margin 18rem
 *   XL ≥ 64rem   contents list 13rem · text · margin 18rem
 *
 * The text column is `--document-measure` (47ch — about 67 characters of Geist at the document
 * type scale) or, Wide, up to 60rem. The grid wears the document body size, so `ch` is measured in
 * the type the text is set in. Each tier also sets `--document-layout-tier` (`s` · `m` · `l` · `xl`)
 * on the grid, which `useDocumentLayoutTier` reads — CSS is the one source of the tier.
 *
 * Server-safe: no hooks here; `useDocumentLayoutTier` (re-exported) lives in its own client file.
 * ----------------------------------------------------------------------------------------------*/

/** A layout tier: `s` (< 36rem), `m` (36–52rem), `l` (52–64rem) or `xl` (≥ 64rem). */
export type DocumentLayoutTier = "s" | "m" | "l" | "xl";

/** Props accepted by `DocumentLayout`. */
export interface DocumentLayoutProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Reserve the comment margin (from the L tier): set it whenever the reader can comment or
   * threads exist, so a first comment never moves the text.
   * @default false
   */
  margin?: boolean;
  /**
   * The document has a contents list (two headings or more): a rail at M and L, a list at XL.
   * @default false
   */
  contents?: boolean;
  /**
   * The text column: `document` (`--document-measure`, 47ch) or `wide` (grows to 60rem into the
   * room the window has; each reader's own choice, never the document's).
   * @default "document"
   */
  measure?: "document" | "wide";
}

// The grid. Three tracks — contents, text, margin — whose side tracks carry the 2rem gap inside
// them (a zero track then costs no gap). The whole group centres in the canvas.
const GRID = cn(
  "grid min-w-0 grid-cols-[[contents-start]_var(--document-layout-contents)_[contents-end_text-start]_minmax(0,var(--document-layout-text))_[text-end_margin-start]_var(--document-layout-margin)_[margin-end]] grid-rows-[auto_auto_1fr] content-start justify-center gap-y-6",
  // The text track's width is measured in the document's own body size (TYP-20).
  "text-sm pointer-coarse:text-base max-sm:text-base",
  "[--document-measure:47ch] [--document-layout-text:var(--document-measure)] data-[measure=wide]:[--document-layout-text:60rem]",
  "[--document-layout-contents:0rem] [--document-layout-margin:0rem]",
  "[--document-layout-tier:s] @min-[36rem]/document-layout:[--document-layout-tier:m] @min-[52rem]/document-layout:[--document-layout-tier:l] @min-[64rem]/document-layout:[--document-layout-tier:xl]",
  "data-contents:@min-[36rem]/document-layout:[--document-layout-contents:3.5rem] data-contents:@min-[64rem]/document-layout:[--document-layout-contents:15rem]",
  "data-margin:@min-[52rem]/document-layout:[--document-layout-margin:20rem]",
  // Print: one column, the text at the page's width, the side columns gone (`DocumentLayout`'s own
  // named page sets the paper margins in `base.css`).
  "print:block print:text-sm/6",
);

/**
 * `DocumentLayout` — the frame of a page read as a document: `DocumentLayoutHeader` (icon, title,
 * meta), `DocumentLayoutBody` (the text), `DocumentLayoutFoot` (what follows it) in one column at
 * the reading measure, with `DocumentLayoutContents` beside it and `DocumentLayoutMargin` (the
 * comment margin) on the other side. Put the parts in reading order: header, contents, body,
 * foot, margin. Prints as one column of header, body and foot.
 *
 * @example
 * <DocumentLayout contents margin={canComment}>
 *   <DocumentLayoutHeader>
 *     <h1 className="text-4xl font-semibold">Pricing v2</h1>
 *   </DocumentLayoutHeader>
 *   <DocumentLayoutContents>
 *     <DocumentLayoutContentsRail>{rail}</DocumentLayoutContentsRail>
 *     <DocumentLayoutContentsList>{list}</DocumentLayoutContentsList>
 *   </DocumentLayoutContents>
 *   <DocumentLayoutBody>
 *     <MarkdownView typeScale="document">{markdown}</MarkdownView>
 *   </DocumentLayoutBody>
 *   <DocumentLayoutFoot>{pagesInside}</DocumentLayoutFoot>
 *   <DocumentLayoutMargin>{threads}</DocumentLayoutMargin>
 * </DocumentLayout>
 */
export function DocumentLayout({
  margin = false,
  contents = false,
  measure = "document",
  className,
  children,
  ...props
}: DocumentLayoutProps) {
  return (
    <div
      data-slot="document-layout"
      data-margin={margin ? "" : undefined}
      data-contents={contents ? "" : undefined}
      data-measure={measure}
      className={cn(
        "@container/document-layout w-full min-w-0 [--document-layout-sticky-top:--spacing(8)] print:[page:document]",
        className,
      )}
      {...props}
    >
      <div
        data-slot="document-layout-grid"
        data-margin={margin ? "" : undefined}
        data-contents={contents ? "" : undefined}
        data-measure={measure}
        className={GRID}
      >
        {children}
      </div>
    </div>
  );
}

/** Native props for a `DocumentLayout` column part. */
export type DocumentLayoutPartProps = React.ComponentPropsWithRef<"div">;

/**
 * `DocumentLayoutHeader` — the title area above the text: icon, title, meta line and banners, in
 * the text column. 8px between its children.
 *
 * @example
 * <DocumentLayoutHeader><h1>Pricing v2</h1><p>Updated 3m ago</p></DocumentLayoutHeader>
 */
export function DocumentLayoutHeader({
  className,
  ...props
}: DocumentLayoutPartProps) {
  return (
    <div
      data-slot="document-layout-header"
      className={cn(
        "col-[text] row-start-1 flex min-w-0 flex-col gap-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBody` — the text column at the reading measure: a `MarkdownView` or `TextEdit`
 * at `typeScale="document"`.
 *
 * @example
 * <DocumentLayoutBody><MarkdownView typeScale="document">{markdown}</MarkdownView></DocumentLayoutBody>
 */
export function DocumentLayoutBody({
  className,
  ...props
}: DocumentLayoutPartProps) {
  return (
    <div
      data-slot="document-layout-body"
      className={cn("col-[text] row-start-2 min-w-0", className)}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutFoot` — what follows the text, in the same column: the pages inside, the page's
 * own comments. 40px below the text; the page's bottom slack under it.
 *
 * @example
 * <DocumentLayoutFoot><PagesInside /></DocumentLayoutFoot>
 */
export function DocumentLayoutFoot({
  className,
  ...props
}: DocumentLayoutPartProps) {
  return (
    <div
      data-slot="document-layout-foot"
      className={cn(
        "col-[text] row-start-3 flex min-w-0 flex-col gap-8 pt-4 pb-24 print:pb-0",
        className,
      )}
      {...props}
    />
  );
}

/** Native `aside` props for `DocumentLayoutContents` and `DocumentLayoutMargin`. */
export type DocumentLayoutAsideProps = React.ComponentPropsWithRef<"aside">;

/**
 * `DocumentLayoutContents` — the contents column, from the M tier when `DocumentLayout` has
 * `contents`: an `aside` named "Contents" that sticks `--document-layout-sticky-top` below the top
 * of the scroll container (default 2rem) and scrolls on its own when taller than the viewport.
 * Holds `DocumentLayoutContentsRail` (M and L) and `DocumentLayoutContentsList` (XL); the one not
 * shown is `display: none`. Below M the host offers its own "On this page" trigger.
 *
 * @example
 * <DocumentLayoutContents>
 *   <DocumentLayoutContentsRail>{rail}</DocumentLayoutContentsRail>
 *   <DocumentLayoutContentsList>{list}</DocumentLayoutContentsList>
 * </DocumentLayoutContents>
 */
export function DocumentLayoutContents({
  className,
  "aria-label": ariaLabel = "Contents",
  ...props
}: DocumentLayoutAsideProps) {
  return (
    <aside
      data-slot="document-layout-contents"
      aria-label={ariaLabel}
      className={cn(
        "sticky top-(--document-layout-sticky-top) col-[contents] row-[1/span_3] hidden max-h-[calc(100dvh-var(--document-layout-sticky-top)*2)] min-w-0 self-start overflow-y-auto overscroll-contain pe-8 @min-[36rem]/document-layout:in-data-contents:block print:hidden",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutContentsRail` — the narrow contents rail (24px) shown at the M and L tiers.
 *
 * @example
 * <DocumentLayoutContentsRail><OutlineRail items={outline} /></DocumentLayoutContentsRail>
 */
export function DocumentLayoutContentsRail({
  className,
  ...props
}: DocumentLayoutPartProps) {
  return (
    <div
      data-slot="document-layout-contents-rail"
      className={cn("w-6 @min-[64rem]/document-layout:hidden", className)}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutContentsList` — the contents list (13rem) shown at the XL tier.
 *
 * @example
 * <DocumentLayoutContentsList><OutlineList items={outline} /></DocumentLayoutContentsList>
 */
export function DocumentLayoutContentsList({
  className,
  ...props
}: DocumentLayoutPartProps) {
  return (
    <div
      data-slot="document-layout-contents-list"
      className={cn(
        "hidden min-w-0 @min-[64rem]/document-layout:block",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutMargin` — the comment margin, from the L tier when `DocumentLayout` has
 * `margin`: an `aside` named "Comments", as tall as the text, positioned (`relative`) so threads
 * can sit at their highlights' tops. Below L the host shows comments in a popover or a sheet.
 *
 * @example
 * <DocumentLayoutMargin>{threads.map((t) => <ThreadCard key={t.id} style={{ top: t.top }} />)}</DocumentLayoutMargin>
 */
export function DocumentLayoutMargin({
  className,
  "aria-label": ariaLabel = "Comments",
  ...props
}: DocumentLayoutAsideProps) {
  return (
    <aside
      data-slot="document-layout-margin"
      aria-label={ariaLabel}
      className={cn(
        "relative col-[margin] row-[1/span_3] hidden min-w-0 ps-8 @min-[52rem]/document-layout:in-data-margin:block print:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutSkeleton`. */
export interface DocumentLayoutSkeletonProps extends React.ComponentPropsWithRef<"div"> {
  /** Reserve the comment margin, as the page will. @default false */
  margin?: boolean;
  /** Reserve the contents column, as the page will. @default false */
  contents?: boolean;
  /** The text column, as the page will. @default "document" */
  measure?: "document" | "wide";
  /**
   * How many lines of text to sketch, in paragraphs of 3, 2 and 3 lines.
   * @default 8
   */
  lines?: number;
  /**
   * The loading state's accessible name.
   * @default "Loading page"
   */
  label?: string;
}

/** Line widths, cycled: a paragraph's lines are never all the same length. */
const LINE_WIDTHS = [
  "w-full",
  "w-[96%]",
  "w-[88%]",
  "w-full",
  "w-[72%]",
  "w-full",
  "w-[92%]",
  "w-[64%]",
];

/**
 * `DocumentLayoutSkeleton` — the page's loading state on the SAME grid and tier as the page: a
 * title bar, a meta bar and paragraphs of text bars at the document line pitch (a 14px bar every
 * 24px, 16 every 26 on a coarse pointer), 12px between paragraphs — so nothing moves when the page
 * arrives. One `status` region, named by `label`.
 *
 * @example
 * <DocumentLayoutSkeleton margin={canComment} contents />
 */
export function DocumentLayoutSkeleton({
  margin = false,
  contents = false,
  measure = "document",
  lines = 8,
  label = "Loading page",
  className,
  ...props
}: DocumentLayoutSkeletonProps) {
  const paragraphs: number[] = [];
  for (let left = Math.max(1, lines), at = 0; left > 0; at++) {
    const size = Math.min(left, [3, 2, 3][at % 3]!);
    paragraphs.push(size);
    left -= size;
  }
  let line = 0;
  return (
    <DocumentLayout
      data-slot="document-layout-skeleton"
      role="status"
      aria-label={label}
      aria-busy
      margin={margin}
      contents={contents}
      measure={measure}
      className={className}
      {...props}
    >
      <DocumentLayoutHeader aria-hidden>
        <Skeleton className="h-9 w-3/5 @min-[36rem]/document-layout:h-10" />
        <Skeleton className="h-5 w-2/5" />
      </DocumentLayoutHeader>
      <DocumentLayoutBody aria-hidden className="flex flex-col gap-3">
        {paragraphs.map((count, index) => (
          <div key={index}>
            {Array.from({ length: count }, () => {
              const width = LINE_WIDTHS[line++ % LINE_WIDTHS.length]!;
              return (
                <div
                  key={line}
                  data-slot="document-layout-skeleton-line"
                  className="flex h-6 items-center pointer-coarse:h-6.5 max-sm:h-6.5"
                >
                  <Skeleton
                    className={cn("h-3.5 pointer-coarse:h-4 max-sm:h-4", width)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </DocumentLayoutBody>
    </DocumentLayout>
  );
}
