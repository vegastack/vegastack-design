// @vegastack markdown-view@0.2.0 sha256-1Knty+rQeeKz3SqcCHheZZLdDLp6essgrUZlK62mG3k=

import * as React from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@vegastack/design';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Element overrides that style react-markdown's output with semantic tokens.
 *
 * react-markdown maps each markdown node to a plain HTML element; we replace the
 * defaults here so the rendered prose uses the design system's token utilities
 * (no `@tailwindcss/typography` dependency). Every value is a semantic token —
 * `text-foreground`, `bg-muted`, `text-info-text`, `border-border` — so the prose
 * tracks the active theme (light/dark) automatically.
 *
 * Defined at module scope so the same object identity is reused across renders.
 */
const markdownComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        'mt-6 mb-3 scroll-m-20 text-h1 text-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        'mt-6 mb-3 scroll-m-20 text-h2 text-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        'mt-5 mb-2 scroll-m-20 text-h3 text-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        'mt-4 mb-2 scroll-m-20 text-h4 text-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        'mt-4 mb-2 text-label text-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        'mt-4 mb-2 text-label text-muted-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn('my-3 leading-relaxed text-foreground first:mt-0 last:mb-0', className)} {...props} />
  ),
  a: ({ className, href, children, ...props }) => {
    const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        className={cn(
          'font-medium text-info-text underline underline-offset-4 hover:text-info-text/(--alpha-link-hover)',
          className,
        )}
        {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...props}
      >
        {children}
        {/* SR-only hint — external links open a new tab, which is otherwise silent to
            assistive tech (register P2-37). */}
        {isExternal ? <span className="sr-only"> (opens in new tab)</span> : null}
      </a>
    );
  },
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        'my-3 ml-6 list-disc text-foreground marker:text-muted-foreground [&>li]:mt-1.5',
        // GFM task lists (`- [x] …`) carry `contains-task-list`: the checkbox IS the
        // marker, so drop the disc (tw-merge resolves the list-style conflict).
        typeof className === 'string' && className.includes('contains-task-list') && 'list-none',
        className,
      )}
      {...props}
    />
  ),
  // GFM task-list checkboxes: react-markdown emits a native `<input type="checkbox" disabled>`,
  // which renders the browser's stock glyph — off-system. Swap in the design-system `Checkbox`
  // instead. It is CONTENT here, not a form control (GitHub parity): inert, but full-contrast —
  // the interactive-disabled 50% dim would misread as a broken control on every task list.
  input: ({ type, checked, className, ...props }) =>
    type === 'checkbox' ? (
      <Checkbox
        size="sm"
        checked={Boolean(checked)}
        disabled
        className={cn('pointer-events-none mr-1.5 align-middle disabled:opacity-100', className)}
      />
    ) : (
      <input type={type} className={className} {...props} />
    ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        'my-3 ml-6 list-decimal text-foreground marker:text-muted-foreground [&>li]:mt-1.5',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn('leading-relaxed', className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        'my-3 border-l-2 border-border pl-4 text-muted-foreground italic',
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    // react-markdown gives inline code a className-less node and fenced code a
    // `language-*` class. Inline code is a chip; fenced code inherits from <pre>.
    const isBlock = typeof className === 'string' && className.includes('language-');
    return (
      <code
        className={cn(
          isBlock
            ? 'font-mono text-base'
            : 'rounded-sm bg-muted px-1.5 py-0.5 font-mono text-base text-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        'my-3 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-base text-foreground',
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn('my-6 border-border', className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="my-3 w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-base text-foreground', className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn('border-b border-border', className)} {...props} />
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn('border-b border-border last:border-0', className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn('px-3 py-2 text-left font-medium text-foreground', className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn('px-3 py-2 text-muted-foreground', className)} {...props} />
  ),
  img: ({ className, ...props }) => (
    // Plain <img>: registry source is framework-agnostic (no next/image dependency).
    <img className={cn('my-3 max-w-full rounded-lg border border-border', className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn('font-medium text-foreground', className)} {...props} />
  ),
  em: ({ className, ...props }) => <em className={cn('italic', className)} {...props} />,
  del: ({ className, ...props }) => (
    <del className={cn('text-muted-foreground line-through', className)} {...props} />
  ),
};

export interface MarkdownViewProps extends React.ComponentPropsWithRef<'div'> {
  /**
   * The markdown string to render. Provided as `children` (preferred) or via the
   * `content` prop — when both are present, `children` wins.
   */
  children?: string;
  /**
   * The markdown string to render. Alternative to `children`; useful when the
   * source comes from a data field rather than JSX text.
   */
  content?: string;
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
 * Prose styling comes from per-element token overrides — headings
 * (`text-foreground`), inline code (`bg-muted font-mono`), links
 * (`text-info-text underline`), blockquotes, lists, and GFM tables — so there is
 * no `@tailwindcss/typography` dependency and the output tracks the theme.
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
export function MarkdownView({ children, content, className, ...props }: MarkdownViewProps) {
  const source = typeof children === 'string' ? children : (content ?? '');

  if (!source.trim()) return null;

  return (
    <div
      data-slot="markdown-view"
      className={cn('text-base text-foreground', className)}
      {...props}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {source}
      </Markdown>
    </div>
  );
}
