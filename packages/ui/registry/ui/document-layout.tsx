// @vegastack document-layout@0.25.70 sha256-MZktpSZrFG1BiLCVGI+JRNey7Tyh8aCB0RcffZUnkvA=

import * as React from "react";
import { cn } from "@vegastack/design";
import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// The tier hook is the one client leaf; it lives in its own file so this one stays server-safe.
export { useDocumentLayoutTier } from "@/components/ui/use-document-layout-tier";
// The meta lines under the title (client parts: the status row fits its chips to the width).
export {
  DocumentLayoutMeta,
  DocumentLayoutMetaBadge,
  DocumentLayoutMetaButton,
  DocumentLayoutMetaField,
  DocumentLayoutMetaGroup,
  DocumentLayoutMetaItem,
  DocumentLayoutMetaLink,
  DocumentLayoutMetaSkeleton,
  DocumentLayoutMetaWords,
  type DocumentLayoutMetaBadgeProps,
  type DocumentLayoutMetaFieldProps,
  type DocumentLayoutMetaGroupProps,
  type DocumentLayoutMetaItemProps,
  type DocumentLayoutMetaProps,
  type DocumentLayoutMetaWordsProps,
} from "@/components/ui/document-layout-meta";
// The tools laid over or around the text (client parts): find, a jump cue, starters, a note.
export {
  DocumentLayoutDecisionBar,
  DocumentLayoutDecisionBarActions,
  DocumentLayoutDecisionBarText,
  DocumentLayoutFindBar,
  DocumentLayoutJumpCue,
  DocumentLayoutNote,
  DocumentLayoutStarter,
  DocumentLayoutStarters,
  type DocumentLayoutDecisionBarProps,
  type DocumentLayoutFindBarProps,
  type DocumentLayoutJumpCueProps,
  type DocumentLayoutNoteProps,
  type DocumentLayoutStarterProps,
  type DocumentLayoutStartersProps,
} from "@/components/ui/document-layout-tools";
export {
  DocumentLayoutBlock,
  DocumentLayoutBlockAction,
  DocumentLayoutBlockFooter,
  DocumentLayoutBlockHeader,
  DocumentLayoutBlockNote,
  DocumentLayoutBlockRow,
  DocumentLayoutBlockRowMain,
  DocumentLayoutBlockRowMeta,
  DocumentLayoutBlockRowRef,
  DocumentLayoutBlockRows,
  DocumentLayoutBlockSkeleton,
  DocumentLayoutBlockTitle,
  DocumentLayoutPageItem,
  DocumentLayoutPageLink,
  DocumentLayoutPageList,
  DocumentLayoutSection,
  DocumentLayoutSectionButton,
  DocumentLayoutSectionHeader,
  DocumentLayoutSectionSkeleton,
  DocumentLayoutSectionTitle,
  type DocumentLayoutPageLinkProps,
  type DocumentLayoutSectionButtonProps,
  type DocumentLayoutSectionProps,
  type DocumentLayoutSectionTitleProps,
} from "@/components/ui/document-layout-sections";

/* ------------------------------------------------------------------------------------------------
 * DocumentLayout — a page read as a document: the title area, the text, what follows the text
 * (sub-pages, page comments), the contents rail in the gutter before the text and a comment
 * margin after it. One grid, five tiers by its OWN width (container queries in rem, so a collapsed
 * sidebar or a split view picks the right one), and one subtree at every width: a column that has
 * no room is `display: none`, never unmounted, so an editor inside never remounts.
 *
 *   tier  width        gutters  text column                    rail  margin
 *   s     < 40rem      0        the full width                 —     — (the host's sheet)
 *   m     40–60rem     3rem     max(36rem, 75%)                ✓     — (a popover)
 *   l     60–90rem     3rem     clamp(40rem, 75%, 52rem)       ✓     20rem
 *   xl    90–120rem    4rem     60rem                          ✓     24rem
 *   2xl   ≥ 120rem     4rem     64rem                          ✓     24rem
 *
 * The text column is fluid — about three quarters of the layout — between each tier's bounds;
 * Wide (`measure="wide"`) is the whole width less the gutters (and the margin). The rail, text
 * and margin are one block, centred: a comment margin shifts the block to the start rather than
 * narrowing the text, and the text gives way only when the width cannot hold text, margin and
 * gutters at once (the text track is `minmax(0, …)`).
 *
 * The contents rail sits in the start gutter, beside the text, from the M tier — whether or not a
 * document has headings, so a contents list that arrives (or goes) never moves the text. It
 * stacks above the text and the margin, so its open panel takes the pointer over both.
 *
 * Each tier also sets `--document-layout-tier` (`s` · `m` · `l` · `xl` · `2xl`) on the grid,
 * which `useDocumentLayoutTier` reads — CSS is the one source of the tier.
 *
 * Server-safe: no hooks here; `useDocumentLayoutTier` (re-exported) lives in its own client file.
 * ----------------------------------------------------------------------------------------------*/

/**
 * A layout tier, by the layout's own width: `s` (< 40rem), `m` (40–60rem), `l` (60–90rem), `xl`
 * (90–120rem) or `2xl` (≥ 120rem). The rail shows from `m`, the comment margin from `l`.
 */
export type DocumentLayoutTier = "s" | "m" | "l" | "xl" | "2xl";

/** Props accepted by `DocumentLayout`. */
export interface DocumentLayoutProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Show the comment margin (from the L tier): set it only while the margin holds something —
   * open threads beside the text or a comment being written — and decide it with the text (on
   * the server, from the thread count), so the first paint is right. Without it the text is
   * centred; the first comment shifts the block to the start.
   * @default false
   */
  margin?: boolean;
  /**
   * The text column: `document` (fluid, about three quarters of the layout within each tier's
   * bounds) or `wide` (the whole width less the gutters and the margin; each reader's own
   * choice, never the document's).
   * @default "document"
   */
  measure?: "document" | "wide";
  /**
   * The canvas takes focus from a click in its read text (`tabIndex={-1}`, never a tab stop), so
   * a host knows the reader is in the page; it shows no focus cue of its own (the text does).
   * @default false
   */
  focusable?: boolean;
}

// The grid: four tracks — the start gutter (the rail's), the text, the margin (its 2rem gap
// inside it, so a zero track costs no gap) and the end gutter — centred as one block. Every width
// is a custom property the tiers set, so the hook, the skeleton and the page share one geometry.
const GRID = cn(
  "relative grid min-w-0 grid-cols-[[rail-start]_var(--document-layout-gutter)_[rail-end_text-start]_minmax(0,var(--document-layout-text))_[text-end_margin-start]_var(--document-layout-margin)_[margin-end]_var(--document-layout-gutter)] grid-rows-[auto_auto_1fr] content-start justify-center gap-y-6",
  "text-sm pointer-coarse:text-base max-sm:text-base",
  "[--document-layout-tier:s] @min-[40rem]/document-layout:[--document-layout-tier:m] @min-[60rem]/document-layout:[--document-layout-tier:l] @min-[90rem]/document-layout:[--document-layout-tier:xl] @min-[120rem]/document-layout:[--document-layout-tier:2xl]",
  "[--document-layout-gutter:0rem] @min-[40rem]/document-layout:[--document-layout-gutter:3rem] @min-[90rem]/document-layout:[--document-layout-gutter:4rem]",
  // The text: fluid within each tier's bounds (`cqw` is the layout's own width). Wide asks for the
  // whole width, which the `minmax(0, …)` track caps at what the gutters and margin leave.
  "[--document-layout-text:100cqw] @min-[40rem]/document-layout:[--document-layout-text:max(36rem,75cqw)] @min-[60rem]/document-layout:[--document-layout-text:clamp(40rem,75cqw,52rem)] @min-[90rem]/document-layout:[--document-layout-text:60rem] @min-[120rem]/document-layout:[--document-layout-text:64rem] data-[measure=wide]:[--document-layout-text:100cqw]",
  "[--document-layout-margin:0rem] data-margin:@min-[60rem]/document-layout:[--document-layout-margin:20rem] data-margin:@min-[90rem]/document-layout:[--document-layout-margin:24rem]",
  // Print: one column, the text at the page's width, the side columns gone (`DocumentLayout`'s own
  // named page sets the paper margins in `base.css`).
  "print:block print:px-0 print:text-sm/6",
);

/**
 * `DocumentLayout` — the frame of a page read as a document: `DocumentLayoutHeader` (icon, title,
 * meta), `DocumentLayoutBody` (the text), `DocumentLayoutFoot` (what follows it) in one fluid
 * column, `DocumentLayoutContents` (the contents rail) in the gutter before it and
 * `DocumentLayoutMargin` (the comment margin) after it. Put the parts in reading order: header,
 * contents, body, foot, margin. Prints as one column of header, body and foot.
 *
 * @example
 * <DocumentLayout margin={threadCount > 0 || drafting}>
 *   <DocumentLayoutHeader>
 *     <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
 *   </DocumentLayoutHeader>
 *   <DocumentLayoutContents>
 *     <TableOfContents variant="rail" side="start" sticky={false} items={outline} />
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
  measure = "document",
  focusable = false,
  className,
  children,
  ...props
}: DocumentLayoutProps) {
  return (
    <div
      data-slot="document-layout"
      data-margin={margin ? "" : undefined}
      data-measure={measure}
      tabIndex={focusable ? -1 : undefined}
      className={cn(
        "@container/document-layout w-full min-w-0 [--document-layout-sticky-top:--spacing(8)] print:[page:document]",
        focusable && "outline-none",
        className,
      )}
      {...props}
    >
      <div
        data-slot="document-layout-grid"
        data-margin={margin ? "" : undefined}
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

/** Props accepted by `DocumentLayoutTitleGroup`. */
export type DocumentLayoutTitleGroupProps = React.ComponentPropsWithRef<"div">;

/**
 * `DocumentLayoutTitleGroup` — the page's icon over its title, 4px apart: a
 * `DocumentLayoutIcon` (optional) and a `DocumentLayoutTitle`. Hovering or focusing anywhere in
 * it shows a `DocumentLayoutIcon` that has `reveal`.
 *
 * @example
 * <DocumentLayoutTitleGroup>
 *   <DocumentLayoutIcon>📘</DocumentLayoutIcon>
 *   <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
 * </DocumentLayoutTitleGroup>
 */
export function DocumentLayoutTitleGroup({
  className,
  ...props
}: DocumentLayoutTitleGroupProps) {
  return (
    <div
      data-slot="document-layout-title-group"
      className={cn(
        "group/document-title relative flex min-w-0 flex-col items-start gap-1",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutIcon`. */
export interface DocumentLayoutIconProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Hidden until the title group is hovered or holds focus (a fine pointer only; a coarse
   * pointer always sees it) — for an "Add icon" control on a page that has none. It keeps its
   * row, so showing it moves nothing.
   * @default false
   */
  reveal?: boolean;
}

/**
 * `DocumentLayoutIcon` — the page's icon above its title, in a 32px row: an emoji at the title's
 * own size (30px), or the control that changes it. A `Button` inside fits the row: an icon button
 * hugs the emoji, a small text button ("Add icon") sits in it, flush with the title's text.
 *
 * @example
 * <DocumentLayoutIcon reveal>
 *   <Button variant="ghost" size="xs"><SmilePlus aria-hidden />Add icon</Button>
 * </DocumentLayoutIcon>
 */
export function DocumentLayoutIcon({
  reveal = false,
  className,
  ...props
}: DocumentLayoutIconProps) {
  return (
    <div
      data-slot="document-layout-icon"
      data-reveal={reveal ? "" : undefined}
      className={cn(
        // One 32px row whatever it holds — an emoji, the button around one, "Add icon" — so
        // adding or removing an icon never moves the title, and the skeleton reserves the same.
        "flex h-8 items-center text-3xl leading-none",
        "[&>[data-slot=button]]:-ms-1.5 [&>[data-slot=button]:has(>span:only-child)]:-ms-1 [&>[data-slot=button]:has(>span:only-child)]:h-8 [&>[data-slot=button]:has(>span:only-child)]:px-1 [&>[data-slot=button]:has(>span:only-child)]:py-0 [&>[data-slot=button]:has(>span:only-child)]:text-3xl [&>[data-slot=button]:has(>span:only-child)]:leading-none",
        "data-reveal:text-muted-foreground data-reveal:opacity-0 data-reveal:transition-opacity data-reveal:group-focus-within/document-title:opacity-100 data-reveal:group-hover/document-title:opacity-100 data-reveal:has-data-popup-open:opacity-100 data-reveal:pointer-coarse:opacity-100 print:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `DocumentLayoutTitle`. */
export interface DocumentLayoutTitleProps extends React.ComponentPropsWithRef<"h1"> {
  /** The title renames in place: the whole row shows the text cursor. @default false */
  editable?: boolean;
}

/**
 * `DocumentLayoutTitle` — the page's title, the document type scale's top step: 30/36 semibold
 * in the heading face, one step above the text's `#` (24/32). Long words break rather than
 * overflow. Put the title's own editor (`EditableCell variant="heading"`) inside it to rename in
 * place.
 *
 * @example
 * <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
 */
export function DocumentLayoutTitle({
  editable = false,
  className,
  ...props
}: DocumentLayoutTitleProps) {
  return (
    <h1
      data-slot="document-layout-title"
      data-editable={editable ? "" : undefined}
      className={cn(
        "w-full min-w-0 font-heading text-3xl/9 font-semibold wrap-break-word text-foreground data-editable:cursor-text",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutBody` — the fluid text column: a `MarkdownView` or `TextEdit`
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
 * `DocumentLayoutContents` — the contents rail's place, from the M tier: an `aside` named
 * "Contents" in the gutter before the text, as tall as the page, its content at the gutter's
 * text-side edge. The gutter is kept whether or not the document has headings, so headings that
 * arrive never move the text. What it holds sticks `--document-layout-sticky-top` below the top
 * of the scroll container (default 2rem), and stacks above the text and the comment margin, so
 * an open panel over them takes the pointer. Put a `TableOfContents variant="rail" side="start"`
 * in it: a column of short dashes that opens into the labelled list over the text. Below M it is
 * `display: none`; the host offers "On this page" in its own menu.
 *
 * @example
 * <DocumentLayoutContents>
 *   <TableOfContents variant="rail" side="start" sticky={false} items={outline} />
 * </DocumentLayoutContents>
 */
export function DocumentLayoutContents({
  className,
  children,
  "aria-label": ariaLabel = "Contents",
  ...props
}: DocumentLayoutAsideProps) {
  return (
    <aside
      data-slot="document-layout-contents"
      aria-label={ariaLabel}
      className={cn(
        // Its own stacking layer over the text and the margin (the sticky box inside makes one
        // too, which would otherwise trap the open panel under the margin that follows it).
        "pointer-events-none relative z-20 col-[rail] row-[1/span_3] hidden min-w-0 @min-[40rem]/document-layout:block print:hidden",
        className,
      )}
      {...props}
    >
      <div
        data-slot="document-layout-contents-inner"
        className="sticky top-(--document-layout-sticky-top) flex justify-end pe-3 *:pointer-events-auto"
      >
        {children}
      </div>
    </aside>
  );
}

/**
 * `DocumentLayoutContentsButton` — "On this page" where the contents rail has no room: a round
 * button floating at the window's bottom end, below the S tier only (from M the rail shows), clear
 * of the home indicator. Give it to `TableOfContents` as its `trigger`, so it opens the outline in
 * a sheet. Fixed, so it moves nothing when the headings arrive. Hidden in print.
 *
 * @example
 * <TableOfContents items={outline} trigger={<DocumentLayoutContentsButton />} />
 */
export function DocumentLayoutContentsButton({
  className,
  "aria-label": ariaLabel = "On this page",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="icon-lg"
      aria-label={ariaLabel}
      data-slot="document-layout-contents-button"
      className={cn(
        "fixed end-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 rounded-full bg-background shadow-md @min-[40rem]/document-layout:hidden print:hidden",
        // A phone's decision bar holds the window's bottom: the button floats above it, by the
        // height the bar measures and publishes (`--document-layout-dock`, unset without one).
        "max-sm:bottom-[calc(env(safe-area-inset-bottom)+1rem+var(--document-layout-dock,0px))]",
        className,
      )}
      {...props}
    >
      <ListTree aria-hidden />
    </Button>
  );
}

/**
 * `DocumentLayoutFloatingButton` — a phone's one floating action ("Edit"): a large, round,
 * labelled button at the window's bottom end, clear of the home indicator, above the text. Fixed,
 * so it moves nothing. Hidden in print.
 *
 * @example
 * <DocumentLayoutFloatingButton onClick={edit}><Pencil aria-hidden />Edit</DocumentLayoutFloatingButton>
 */
export function DocumentLayoutFloatingButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      size="lg"
      data-slot="document-layout-floating-button"
      className={cn(
        "fixed end-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 rounded-full shadow-lg print:hidden",
        // A phone's decision bar holds the window's bottom: the button floats above it, by the
        // height the bar measures and publishes (`--document-layout-dock`, unset without one).
        "max-sm:bottom-[calc(env(safe-area-inset-bottom)+1rem+var(--document-layout-dock,0px))]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `DocumentLayoutMargin` — the comment margin, from the L tier when `DocumentLayout` has
 * `margin`: an `aside` named "Comments" after the text (20rem, 24rem from XL, its 2rem gap
 * included), as tall as the text, positioned (`relative`) so threads can sit at their
 * highlights' tops. Cards in it take its whole width. Below L the host shows comments in a
 * popover or a sheet.
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
        "relative col-[margin] row-[1/span_3] hidden min-w-0 ps-8 @min-[60rem]/document-layout:in-data-margin:block print:hidden",
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
  /** The text column, as the page will. @default "document" */
  measure?: "document" | "wide";
  /**
   * Reserve the icon row above the title (32px and the group's 4px), as a page whose
   * `DocumentLayoutTitleGroup` holds a `DocumentLayoutIcon` will — an editable page always does.
   * @default false
   */
  icon?: boolean;
  /**
   * How many 20px meta lines to sketch under the title (8px apart), as the page's header has.
   * @default 1
   */
  metaLines?: number;
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
 * `DocumentLayoutSkeleton` — the page's loading state on the SAME grid and tier as the page: an
 * icon row (`icon`), a title line, `metaLines` meta lines and paragraphs of text bars at the
 * document line pitch (a 14px bar every 24px, 16 every 26 on a coarse pointer), 12px between
 * paragraphs — so nothing moves when the page arrives. One `status` region, named by `label`.
 *
 * @example
 * <DocumentLayoutSkeleton margin={threadCount > 0} />
 */
export function DocumentLayoutSkeleton({
  margin = false,
  measure = "document",
  icon = false,
  metaLines = 1,
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
      measure={measure}
      className={className}
      {...props}
    >
      <DocumentLayoutHeader aria-hidden>
        <DocumentLayoutTitleGroup>
          {icon ? (
            <DocumentLayoutIcon>
              <Skeleton className="size-7.5" />
            </DocumentLayoutIcon>
          ) : null}
          {/* The title's 36px line, its bar inside it, as `DocumentLayoutTitle` sets it. */}
          <div className="flex h-9 w-full items-center">
            <Skeleton className="h-7 w-3/5" />
          </div>
        </DocumentLayoutTitleGroup>
        {Array.from({ length: Math.max(0, metaLines) }, (_, index) => (
          <div key={index} className="flex h-5 items-center">
            <Skeleton
              className={cn("h-3.5", index % 2 === 0 ? "w-2/5" : "w-1/4")}
            />
          </div>
        ))}
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
