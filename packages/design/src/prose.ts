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
 * which `preset.css` scans through `@source "./dist"` (the same contract `surfaceInteractive` and
 * `fillInteractive` rely on).
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
  /** The root's own ink and size — every rule below is relative to this. */
  root: "text-base text-foreground",

  // Headings. `scroll-m-20` keeps an anchored heading clear of a sticky header; the weight ladder
  // caps at 500, which the `text-h*` roles already carry.
  h1: "[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:scroll-m-20 [&_h1]:text-h1 [&_h1]:text-foreground [&_h1]:first:mt-0",
  h2: "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:scroll-m-20 [&_h2]:text-h2 [&_h2]:text-foreground [&_h2]:first:mt-0",
  h3: "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:scroll-m-20 [&_h3]:text-h3 [&_h3]:text-foreground [&_h3]:first:mt-0",
  h4: "[&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:scroll-m-20 [&_h4]:text-h4 [&_h4]:text-foreground [&_h4]:first:mt-0",
  // h5/h6 leave the display tier and become labels — the type scale has no sixth heading size.
  h5: "[&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:text-label [&_h5]:text-foreground [&_h5]:first:mt-0",
  h6: "[&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:text-label [&_h6]:text-muted-foreground [&_h6]:first:mt-0",

  p: "[&_p]:my-3 [&_p]:leading-relaxed [&_p]:text-foreground [&_p]:first:mt-0 [&_p]:last:mb-0",

  // Marks. Links are `info` ink per design.md §Colours; `s` is Tiptap's strike element and `del`
  // is GFM's — the same mark from two producers.
  a: "[&_a]:font-medium [&_a]:text-info-text [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-info-text/(--alpha-link-hover)",
  strong: "[&_strong]:font-medium [&_strong]:text-foreground",
  em: "[&_em]:italic",
  del: "[&_del]:text-muted-foreground [&_del]:line-through [&_s]:text-muted-foreground [&_s]:line-through",

  // Lists. A GFM task list carries `contains-task-list` and its checkbox IS the marker, so the
  // disc goes — expressed as a second, more specific descendant rule rather than a class on the
  // element, which would lose the cascade (see the header).
  ul: "[&_ul]:my-3 [&_ul]:ms-6 [&_ul]:list-disc [&_ul]:text-foreground [&_ul]:marker:text-muted-foreground [&_ul.contains-task-list]:list-none",
  ol: "[&_ol]:my-3 [&_ol]:ms-6 [&_ol]:list-decimal [&_ol]:text-foreground [&_ol]:marker:text-muted-foreground",
  li: "[&_li]:mt-1.5 [&_li]:leading-relaxed",

  blockquote:
    "[&_blockquote]:my-3 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",

  // Inline code is a chip. Code inside a `pre` is not: it inherits the panel's ground, so the chip
  // is undone at higher specificity (`[&_pre_code]` is (0,1,2) against the chip's (0,1,1)).
  code: "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-base [&_code]:text-foreground",
  // A bare `<pre>` wears `CodeBlock`'s surface — the same sunken panel, one vocabulary (B4-09).
  // `CodeBlock`'s own `pre` is excluded: it already sits inside a `figure` carrying the border,
  // radius and ground, and re-applying them here would draw a second panel inside the first.
  pre: "[&_pre:not([data-slot='code-block-pre'])]:my-3 [&_pre:not([data-slot='code-block-pre'])]:overflow-x-auto [&_pre:not([data-slot='code-block-pre'])]:rounded-lg [&_pre:not([data-slot='code-block-pre'])]:border [&_pre:not([data-slot='code-block-pre'])]:border-border [&_pre:not([data-slot='code-block-pre'])]:bg-muted [&_pre:not([data-slot='code-block-pre'])]:p-4 [&_pre:not([data-slot='code-block-pre'])]:text-foreground",
  preCode:
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-code [&_pre_code]:text-foreground",

  hr: "[&_hr]:my-6 [&_hr]:border-border",

  // GFM tables. The scroll container is structural and belongs to the consumer (MarkdownView wraps
  // the table in an `overflow-x-auto` div); these are the cell and rule tokens.
  table:
    "[&_table]:w-full [&_table]:border-collapse [&_table]:text-base [&_table]:text-foreground [&_thead]:border-b [&_thead]:border-border [&_tr]:border-b [&_tr]:border-border [&_tr]:last:border-0 [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:font-medium [&_th]:text-foreground [&_td]:px-3 [&_td]:py-2 [&_td]:text-muted-foreground",

  img: "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border",
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
