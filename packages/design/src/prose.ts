/**
 * THE prose recipe — one token vocabulary for rendered rich text (audit B4-09, 2026-09-07).
 *
 * Two surfaces render prose the system did not author element-by-element: `MarkdownView`
 * (react-markdown turns a markdown string into plain HTML elements) and `TextEdit` (ProseMirror
 * owns the contenteditable DOM). Before this file each restated the same heading/paragraph/list/
 * code/quote recipe in its own grammar — a `Components` map in one, 69 `[&_h1]:` rules in the
 * other — and they had already drifted (`h4`–`h6`, `table`, `img` existed on one side only).
 *
 * ## Why descendant variants and not per-element classes
 *
 * A prose root cannot put a class on every element: ProseMirror generates the editor's DOM, and
 * react-markdown's output is only reachable through an override map. Descendant variants
 * (`[&_h1]:mt-6` → `.recipe h1 { margin-top: … }`) style both from ONE string on the root, which
 * is what makes "MarkdownView and TextEdit render the same computed styles" true by construction
 * rather than by review.
 *
 * It also settles a cascade trap the two-grammar version would have re-created: `[&_h1]:mt-6`
 * compiles at specificity (0,1,1) and a plain `.mt-6` on the element at (0,1,0), so an
 * element-level class silently LOSES to a root-level descendant rule. The two forms cannot
 * coexist on one tree; the root form is the one that works for both consumers.
 *
 * Every value is a literal so Tailwind's scanner sees it in this file — and in the shipped `dist`,
 * which `preset.css` scans through `@source "./dist"` (the same contract `"hover:bg-accent"` and
 * the family's own hover wash rely on).
 *
 * Logical properties throughout (`ms`/`ps`/`border-s`/`text-start`): prose is the surface most
 * likely to carry translated content, and the contract lane asserts RTL containment.
 *
 * @example
 * // A prose root — the whole recipe:
 * <div className={cn(proseClassName, className)} />
 *
 * @example
 * // One element's rules, composed into a narrower surface:
 * <div className={cn(prose.root, prose.p, prose.code)} />
 */
export const prose = {
  /**
   * The root's own FAMILY, ink and size — every rule below is relative to this.
   *
   * `font-sans` is load-bearing and was missing. A prose root has to be self-describing, because
   * neither of its two consumers sets a family of its own: `MarkdownView` and `TextEdit` both wear
   * nothing but `proseClassName`. With no family declared here, prose inherited whatever surrounded
   * it — drop either surface inside a mono container (`terminal-body` is one in this very
   * registry, and a chat or log panel is the obvious consumer case) and the WHOLE tree went mono:
   * headings, paragraphs, table cells, and the `1.` / `2.` markers of an ordered list, because
   * `::marker` inherits font properties from its originating element.
   *
   * Geist Mono is now the exception the recipe names explicitly — `code`, `pre` and `pre code` —
   * rather than something prose falls into by accident. A consumer who genuinely wants mono prose
   * still says so on the root, where it reads as a decision.
   *
   * `min-w-0 wrap-anywhere` is the no-horizontal-overflow contract (2026-09-26): a long word, URL
   * or inline code run breaks inside the line instead of widening the page, and `anywhere` (not
   * `break-word`) also lowers the min-content width, so a prose root inside a flex item shrinks.
   * Fenced code (`white-space: pre`) and tables keep their lines and scroll inside their own box.
   */
  root: "font-sans text-sm font-normal text-foreground min-w-0 wrap-anywhere",

  // Headings follow the app's type scale (design.md §Headings), not a document scale: the page
  // title is the only `text-2xl`, so a heading inside rendered text stops at `text-lg` for `#`,
  // the section size (`text-base`) for `##`, and body size for everything below — weight carries
  // the rest. Every heading wears `font-heading` like the app's own titles.
  h1: "[&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:scroll-m-20 [&_h1]:font-heading [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:first:mt-0",
  h2: "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:scroll-m-20 [&_h2]:font-heading [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:first:mt-0",
  h3: "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:scroll-m-20 [&_h3]:font-heading [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:first:mt-0",
  h4: "[&_h4]:mt-3 [&_h4]:mb-1.5 [&_h4]:font-heading [&_h4]:text-sm [&_h4]:font-medium [&_h4]:text-foreground [&_h4]:first:mt-0",
  h5: "[&_h5]:mt-3 [&_h5]:mb-1.5 [&_h5]:font-heading [&_h5]:text-sm [&_h5]:font-medium [&_h5]:text-foreground [&_h5]:first:mt-0",
  h6: "[&_h6]:mt-3 [&_h6]:mb-1.5 [&_h6]:font-heading [&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-foreground [&_h6]:first:mt-0",

  // Body text is the app's body text — size, leading and ink inherit from the root, so a paragraph
  // here is indistinguishable from any other `text-sm` paragraph in the product. No prose look.
  p: "[&_p]:my-2 [&_p]:first:mt-0 [&_p]:last:mb-0",

  // Marks. Links are `info` ink per design.md §Colours at body weight; `s` is Tiptap's strike
  // element and `del` is GFM's — the same mark from two producers.
  a: "[&_a]:text-info-text [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-info-text/88",
  strong: "[&_strong]:font-semibold",
  em: "[&_em]:italic",
  del: "[&_del]:line-through [&_s]:line-through",

  // Lists. Items and markers are body text: family, size and ink inherit (a `::marker` takes the
  // item's font), so `1.` and `•` never read as a second typeface or a second colour. One thing
  // does NOT inherit: the user-agent stylesheet gives `::marker` `font-variant-numeric:
  // tabular-nums`, and Geist's tabular figures are fixed-width — that is what made ordered-list
  // numbers look monospaced. `marker:normal-nums` restores the body's proportional figures. A GFM task
  // list carries `contains-task-list` and its checkbox IS the marker, so the disc goes — expressed
  // as a second, more specific descendant rule rather than a class on the element, which would
  // lose the cascade (see the header).
  ul: "[&_ul]:my-2 [&_ul]:ms-5 [&_ul]:list-disc [&_ul.contains-task-list]:list-none",
  ol: "[&_ol]:my-2 [&_ol]:ms-5 [&_ol]:list-decimal",
  li: "[&_li]:mt-1 [&_li]:marker:normal-nums [&_li]:marker:text-inherit [&_li_p]:my-0",

  // Task lists, one shape for both producers: `MarkdownView` tags the GFM list
  // `data-type="taskList"` and each item `data-type="taskItem"` with its body in a
  // `data-slot="task-item-content"` box, which is exactly the DOM Tiptap's `TaskItem` node view
  // renders — so the checkbox IS the marker, the body wraps beside it, and a nested list indents
  // under the body in view and edit alike. The checkbox's hit area is trimmed to exactly 24px tall
  // here (`after:-inset-y-1.25` — the pseudo insets from inside the 1px border — not its own 30px) and items sit 26px apart (`mt-1.5`), so each
  // checkbox owns a whole 24px target with a hair to spare instead of reaching into its
  // neighbour's.
  taskList:
    "[&_ul[data-type=taskList]]:ms-0 [&_ul[data-type=taskList]]:list-none [&_li[data-type=taskItem]]:mt-1.5 [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2 [&_li[data-type=taskItem]_[data-slot=checkbox]]:mt-0.5 [&_li[data-type=taskItem]_[data-slot=checkbox]]:me-0 [&_li[data-type=taskItem]_[data-slot=checkbox]]:after:-inset-y-1.25 [&_[data-slot=task-item-content]]:min-w-0 [&_[data-slot=task-item-content]]:flex-1",

  blockquote:
    "[&_blockquote]:my-2 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3",

  // Inline code is a chip. Code inside a `pre` is not: it inherits the panel's ground, so the chip
  // is undone at higher specificity (`[&_pre_code]` is (0,1,2) against the chip's (0,1,1)).
  // Slack/Notion: a neutral grey chip with orange text (the syntax palette's literal colour), so
  // inline code reads apart from prose in both themes; `tag-orange-text` on `muted` clears AA.
  code: "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-tag-orange-text",
  // A bare `<pre>` wears `CodeBlock`'s surface — the same sunken panel, one vocabulary (B4-09).
  // `CodeBlock`'s own `pre` is excluded: it already sits inside a `figure` carrying the border,
  // radius and ground, and re-applying them here would draw a second panel inside the first.
  pre: "[&_pre:not([data-slot='code-block-pre'])]:my-2 [&_pre:not([data-slot='code-block-pre'])]:overflow-x-auto [&_pre:not([data-slot='code-block-pre'])]:rounded-lg [&_pre:not([data-slot='code-block-pre'])]:border [&_pre:not([data-slot='code-block-pre'])]:border-border [&_pre:not([data-slot='code-block-pre'])]:bg-muted [&_pre:not([data-slot='code-block-pre'])]:p-4 [&_pre:not([data-slot='code-block-pre'])]:text-foreground",
  preCode:
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-sm [&_pre_code]:text-foreground",

  hr: "[&_hr]:my-4 [&_hr]:border-border",

  // GFM tables, Notion's simple table: a rounded outer border, a rule between every cell, and a
  // header row on a subtle muted ground at medium weight. The scroll container is structural and
  // belongs to the consumer (MarkdownView and TextEdit each wrap the table in an `overflow-x-auto`
  // box); these are the cell and rule tokens. `border-separate` with zero spacing is what lets the
  // table itself take the radius (a collapsed table cannot); each cell draws only its bottom and
  // end rule, the last row and column drop theirs against the outer border, and the corner cells
  // take the radius so a header or selected fill never pokes past the curve. Cells take
  // `break-word`, not the root's `anywhere`, so a column keeps its words whole and the table scrolls
  // in its box rather than crushing to one character per line.
  table:
    "[&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:rounded-lg [&_table]:border [&_table]:border-border",
  tableRules:
    "[&_th]:border-e [&_th]:border-b [&_th]:border-border [&_td]:border-e [&_td]:border-b [&_td]:border-border [&_tr>*:last-child]:border-e-0 [&_tbody>tr:last-child>*]:border-b-0 [&_tr:first-child>*:first-child]:rounded-ss-lg [&_tr:first-child>*:last-child]:rounded-se-lg [&_tbody>tr:last-child>*:first-child]:rounded-es-lg [&_tbody>tr:last-child>*:last-child]:rounded-ee-lg",
  tableCells:
    "[&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:align-top [&_th]:font-medium [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td_p]:my-0 [&_th_p]:my-0 [&_th]:wrap-break-word [&_td]:wrap-break-word",

  img: "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border",
} as const;

/** The element roles the prose recipe covers. */
export type ProseElement = keyof typeof prose;

/**
 * The whole recipe as one class string — what a prose root wears.
 *
 * Joined rather than merged: every entry scopes a different selector, so there is no conflict for
 * `cn` to resolve, and a plain join keeps the composition free of a `tailwind-merge` pass on a
 * string that never changes.
 */
export const proseClassName: string = Object.values(prose).join(" ");

/**
 * THE document type scale — `typeScale="document"` on `MarkdownView` and `TextEdit` (TYP-20, MK
 * 2026-10-14, Regent Pages v2 Round 2). A page read as a document: calm 14/24 body text on a fine
 * pointer, 16/26 on a coarse pointer or a narrow window (the same 16px INT-13 already gives a
 * touch editor, so reading and editing never jump and iOS never zooms), a 12px paragraph gap,
 * and headings H1 24 · H2 20 · H3 16 with more room above than below. On 16px body text H3 steps
 * up to 18 and H4 to 16, so a heading never sits at the body's own size.
 *
 * It is an OVERLAY on `prose`, never a replacement: compose it after the base recipe through
 * `cn` (tailwind-merge resolves each `[&_h1]:text-lg` against its `[&_h1]:text-2xl/8`), or use
 * `proseDocumentClassName`, which is that composition done once.
 *
 * The column's width is the layout's, not the recipe's: `DocumentLayout` sizes its fluid text
 * column by tier, in the same font size this recipe sets.
 *
 * @example
 * <div className={cn(proseClassName, proseDocument.root, proseDocument.h1)} />
 */
export const proseDocument = {
  /** Body: 14/24 on a fine pointer, 16/26 on a coarse pointer or below the `sm` width. */
  root: "text-sm/6 pointer-coarse:text-base/6.5 max-sm:text-base/6.5",
  // Headings: semibold (the base recipe's weight), more room above than below. The first block
  // keeps `first:mt-0` from the base recipe. `scroll-mt-18` clears a 56px sticky header + 16.
  h1: "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:scroll-mt-18 [&_h1]:text-2xl/8",
  h2: "[&_h2]:mt-7 [&_h2]:mb-2 [&_h2]:scroll-mt-18 [&_h2]:text-xl/7",
  h3: "[&_h3]:mt-6 [&_h3]:mb-1.5 [&_h3]:scroll-mt-18 [&_h3]:text-base/6 pointer-coarse:[&_h3]:text-lg/7 max-sm:[&_h3]:text-lg/7",
  h4: "[&_h4]:mt-5 [&_h4]:mb-1 [&_h4]:scroll-mt-18 [&_h4]:text-sm/6 [&_h4]:font-semibold pointer-coarse:[&_h4]:text-base/6.5 max-sm:[&_h4]:text-base/6.5",
  // A 12px gap between paragraphs; none before the first or after the last.
  p: "[&_p]:my-3",
  // Lists indent 24, items 4 apart, a nested list 4 below its item's text.
  ul: "[&_ul]:my-3 [&_ul]:ms-6",
  ol: "[&_ol]:my-3 [&_ol]:ms-6",
  li: "[&_li_ul]:mt-1 [&_li_ul]:mb-0 [&_li_ol]:mt-1 [&_li_ol]:mb-0",
  // A quote is a rule and an indent, never italic; blocks breathe 16 apart.
  blockquote: "[&_blockquote]:my-4 [&_blockquote]:ps-4",
  // No orange in documents: inline code is a grey chip in the body's own ink.
  code: "[&_code]:text-foreground",
  pre: "[&_pre:not([data-slot='code-block-pre'])]:my-4",
  hr: "[&_hr]:my-6",
  img: "[&_img]:my-4",
  // Tables read at 14/20 at every pointer, 16 from the blocks around them (the scroll box is the
  // consumer's: `MarkdownView`'s `markdown-table`, the editor's `.tableWrapper`).
  table:
    "[&_th]:text-sm/5 [&_td]:text-sm/5 [&_[data-slot=markdown-table]]:my-4 [&_.tableWrapper]:my-4",
  // Callouts, toggles, code blocks and media sit 16 from their neighbours; a toggle's summary is
  // a 24px row, 44px on a coarse pointer.
  blocks:
    "[&_[data-slot=callout]]:my-4 [&_[data-slot=code-block]]:my-4 [&_details]:my-4 [&_video]:my-4 [&_audio]:my-4 [&_summary]:min-h-6 pointer-coarse:[&_summary]:min-h-11",
} as const;

/** The element roles the document overlay covers. */
export type ProseDocumentElement = keyof typeof proseDocument;
