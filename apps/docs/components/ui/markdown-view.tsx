// @vegastack markdown-view@0.7.1 sha256-85B8qnL7zhoaj5YrEA6DQ/611HANWhRwGGm9a5VlYJs=

import * as React from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, proseClassName } from "@vegastack/design";
import { Checkbox } from "@/components/ui/checkbox";
// `CodeBlock` owns the fenced-code surface (header + copy + sunken mono panel); shadcn rewrites
// this alias on `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { CodeBlock } from "@/components/ui/code-block";

/** Flatten a react-markdown children tree to raw text (for the copy affordance). */
function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return extractText(node.props.children);
  return "";
}

/**
 * The overrides react-markdown needs for BEHAVIOUR, not for styling.
 *
 * Every typographic rule lives in the shared `prose` recipe (`@vegastack/design`), worn once by
 * this component's root — the same string `TextEdit` puts on its editor surface, so the two render
 * identical computed styles (audit B4-09). What remains here is the handful of nodes whose default
 * output is wrong for a reason no class can fix:
 *
 * - `a` — an external link needs `target`/`rel` and an SR-only "opens in new tab" hint.
 * - `input` — a GFM task-list checkbox must be the system `Checkbox`, not the browser glyph.
 * - `pre` — fenced code delegates to `CodeBlock` (header + copy affordance).
 * - `table` — the horizontal scroll container the recipe deliberately does not own.
 *
 * None of them sets a typography class, and none should: an element-level class LOSES to the
 * root's descendant rules (specificity (0,1,0) against (0,1,1)), so it would read as an override
 * and behave as a no-op. Restyle prose by composing `prose`, never by re-entering this map.
 *
 * Defined at module scope so the same object identity is reused across renders.
 */
const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: "_blank", rel: "noreferrer noopener" }
          : {})}
        {...props}
      >
        {children}
        {/* SR-only hint — external links open a new tab, which is otherwise silent to
            assistive tech (register P2-37). */}
        {isExternal ? (
          <span className="sr-only"> (opens in new tab)</span>
        ) : null}
      </a>
    );
  },
  // GFM task-list checkboxes: react-markdown emits a native `<input type="checkbox" disabled>`,
  // which renders the browser's stock glyph — off-system. Swap in the design-system `Checkbox`
  // instead. It is CONTENT here, not a form control (GitHub parity): inert, but full-contrast —
  // the interactive-disabled 50% dim would misread as a broken control on every task list.
  input: ({ type, checked, className, ...props }) =>
    type === "checkbox" ? (
      <Checkbox
        size="sm"
        checked={Boolean(checked)}
        disabled
        className={cn(
          "pointer-events-none me-1.5 align-middle disabled:opacity-100",
          className,
        )}
      />
    ) : (
      <input type={type} className={className} {...props} />
    ),
  pre: ({ className, children, ...props }) => {
    // Fenced code delegates to `CodeBlock` (Wave 3): derive the language from the
    // code child's `language-*` class and the copy source from its text content,
    // so every fenced block gets the header + copy affordance for free.
    const codeChild = React.Children.toArray(children).find(
      (
        child,
      ): child is React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }> => React.isValidElement(child),
    );
    const languageMatch = /language-([\w-]+)/.exec(
      codeChild?.props.className ?? "",
    );
    const raw = extractText(codeChild?.props.children).replace(/\n$/, "");
    return (
      <CodeBlock
        language={languageMatch?.[1]}
        copyValue={raw || undefined}
        className={cn("my-3", className)}
        {...props}
      >
        {codeChild?.props.children}
      </CodeBlock>
    );
  },
  // The recipe styles the cells; the scroll container is structure. A wide table must scroll
  // inside its own box rather than widen the page (the 320px reflow contract).
  table: ({ className, ...props }) => (
    <div className="my-3 w-full overflow-x-auto">
      <table className={className} {...props} />
    </div>
  ),
};

function normalizeAllowedImageOrigins(origins: readonly string[]) {
  return new Set(
    origins.map((origin) => {
      const url = new URL(origin);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw new Error(
          `allowedImageOrigins entries must be HTTP(S) origins without paths: ${origin}`,
        );
      }
      return url.origin;
    }),
  );
}

function imageSourceAllowed(
  src: string | undefined,
  allowed: ReadonlySet<string>,
) {
  if (!src) return false;
  try {
    const url = new URL(src);
    return (
      ["http:", "https:"].includes(url.protocol) && allowed.has(url.origin)
    );
  } catch {
    // Relative paths stay on the embedding application's origin. Protocol-relative URLs are
    // external despite parsing as relative without a base, so keep them blocked.
    return !src.startsWith("//") && !/^[a-z][a-z0-9+.-]*:/i.test(src);
  }
}

function componentsWithImagePolicy(
  allowedImageOrigins: readonly string[],
): Components {
  const allowed = normalizeAllowedImageOrigins(allowedImageOrigins);
  return {
    ...markdownComponents,
    img: ({ className, src, alt, ...props }) => {
      if (typeof src !== "string" || !imageSourceAllowed(src, allowed)) {
        return (
          <span
            data-slot="markdown-image-blocked"
            className={cn(
              "my-3 block rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground",
              className,
            )}
          >
            {alt || "Remote image blocked"}
          </span>
        );
      }
      let remote = false;
      try {
        remote = Boolean(new URL(src));
      } catch {
        // Relative URL: the browser will load it from the embedding application's own origin.
      }
      return (
        // Plain <img>: registry source is framework-agnostic (no next/image dependency).
        <img
          {...props}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy={remote ? "no-referrer" : undefined}
          // Frame and rhythm come from `prose.img` on the root; this entry exists only for the
          // origin policy and the loading hints.
          className={className}
        />
      );
    },
  };
}

/** Props accepted by `MarkdownView`. */
export interface MarkdownViewProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The markdown string to render. Provided as `children` (preferred) or via the
   * `content` prop — when both are present, `children` wins.

   * @default undefined
   */
  children?: string;
  /**
   * The markdown string to render. Alternative to `children`; useful when the
   * source comes from a data field rather than JSX text.

   * @default undefined
   */
  content?: string;
  /**
   * Exact HTTP(S) origins allowed to load Markdown images. Relative/same-site paths are always
   * allowed. Absolute and protocol-relative remote images are blocked by default to prevent
   * untrusted Markdown from creating tracking requests. Allowed remote images use a no-referrer
   * policy.

   * @default []
   */
  allowedImageOrigins?: readonly string[];
}

/**
 * `MarkdownView` — render a markdown string as safe, token-styled HTML.
 *
 * Built on [`react-markdown`](https://github.com/remarkjs/react-markdown) with
 * `remark-gfm` (GitHub-flavored markdown: tables, strikethrough, task lists,
 * autolinks). **XSS-safe by construction** — react-markdown builds a React tree
 * directly (never `dangerouslySetInnerHTML`) and escapes any raw HTML in the
 * source, so `<script>`/`<img onerror>`/inline HTML in untrusted input is
 * rendered as inert text rather than executed. (`rehype-raw` is intentionally
 * NOT added, as it would re-enable raw HTML.)
 *
 * Prose styling is the shared `prose` recipe from `@vegastack/design`, worn as a
 * single class on the root — headings, paragraphs, marks, lists, blockquotes,
 * inline code, fenced code, rules, images and GFM tables, every value a semantic
 * token. There is no `@tailwindcss/typography` dependency, the output tracks the
 * theme, and `TextEdit` wears the same string, so rendered markdown and edited
 * rich text are the same typography rather than two that agree by review.
 *
 * Server-safe: no hooks, no `'use client'`. Renders nothing for empty/whitespace
 * input.
 *
 * @example
 * <MarkdownView># Hello\n\nThis is **markdown**.</MarkdownView>
 *
 * @example
 * // From a data field
 * <MarkdownView content={task.description} />
 */
export function MarkdownView({
  children,
  content,
  allowedImageOrigins = [],
  className,
  ...props
}: MarkdownViewProps) {
  const source = typeof children === "string" ? children : (content ?? "");

  if (!source.trim()) return null;

  return (
    <div
      data-slot="markdown-view"
      className={cn(proseClassName, className)}
      {...props}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={componentsWithImagePolicy(allowedImageOrigins)}
      >
        {source}
      </Markdown>
    </div>
  );
}
