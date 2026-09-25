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
   */
  root: "font-sans text-sm font-normal text-foreground",

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
  li: "[&_li]:mt-1 [&_li]:marker:normal-nums [&_li]:marker:text-foreground [&_li_p]:my-0",

  // Task lists, one shape for both producers: `MarkdownView` tags the GFM list
  // `data-type="taskList"` and each item `data-type="taskItem"` with its body in a
  // `data-slot="task-item-content"` box, which is exactly the DOM Tiptap's `TaskItem` node view
  // renders — so the checkbox IS the marker, the body wraps beside it, and a nested list indents
  // under the body in view and edit alike.
  taskList:
    "[&_ul[data-type=taskList]]:ms-0 [&_ul[data-type=taskList]]:list-none [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2 [&_li[data-type=taskItem]_[data-slot=checkbox]]:mt-0.5 [&_li[data-type=taskItem]_[data-slot=checkbox]]:me-0 [&_[data-slot=task-item-content]]:min-w-0 [&_[data-slot=task-item-content]]:flex-1",

  blockquote:
    "[&_blockquote]:my-2 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3",

  // Inline code is a chip. Code inside a `pre` is not: it inherits the panel's ground, so the chip
  // is undone at higher specificity (`[&_pre_code]` is (0,1,2) against the chip's (0,1,1)).
  code: "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-foreground",
  // A bare `<pre>` wears `CodeBlock`'s surface — the same sunken panel, one vocabulary (B4-09).
  // `CodeBlock`'s own `pre` is excluded: it already sits inside a `figure` carrying the border,
  // radius and ground, and re-applying them here would draw a second panel inside the first.
  pre: "[&_pre:not([data-slot='code-block-pre'])]:my-2 [&_pre:not([data-slot='code-block-pre'])]:overflow-x-auto [&_pre:not([data-slot='code-block-pre'])]:rounded-lg [&_pre:not([data-slot='code-block-pre'])]:border [&_pre:not([data-slot='code-block-pre'])]:border-border [&_pre:not([data-slot='code-block-pre'])]:bg-muted [&_pre:not([data-slot='code-block-pre'])]:p-4 [&_pre:not([data-slot='code-block-pre'])]:text-foreground",
  preCode:
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-sm [&_pre_code]:text-foreground",

  hr: "[&_hr]:my-4 [&_hr]:border-border",

  // GFM tables. The scroll container is structural and belongs to the consumer (MarkdownView wraps
  // the table in an `overflow-x-auto` div); these are the cell and rule tokens.
  table:
    "[&_table]:w-full [&_table]:border-collapse [&_thead]:border-b [&_thead]:border-border [&_tr]:border-b [&_tr]:border-border [&_tr]:last:border-0 [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:font-medium [&_td]:px-3 [&_td]:py-2 [&_td_p]:my-0 [&_th_p]:my-0",

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
