// @vegastack code-block@0.11.2 sha256-l8dIzz4h0g0KwS+9bnQYTw+oui9T3btVAZr4JGdJZJs=

import * as React from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * CodeBlock — a code panel with an optional header (Wave 3, from the AI-chat teardown): a
 * sunken mono surface topped by a hairline bar carrying the language label (small uppercase mono)
 * and a copy affordance. Server-safe root — `CopyButton` is the one client leaf and only
 * mounts when `copyValue` is provided. `MarkdownView` delegates fenced code here, so chat
 * transcripts, docs prose, and hand-composed examples all share one code surface.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `CodeBlock`. */
export interface CodeBlockProps extends React.ComponentPropsWithRef<"figure"> {
  /**
   * Language label shown in the header, as small uppercase mono. Omit both this
   * and `copyValue` to render a bare, headerless block.
   * @default undefined
   */
  language?: string;
  /** When set, a `CopyButton` for this raw source appears in the header. @default undefined */
  copyValue?: string;
  /** Accessible label for the copy control. @default `Copy ${language ?? 'code'}` */
  copyLabel?: string;
}

/**
 * `CodeBlock` — compose the code content as children (it lands inside the
 * block's own `<pre><code>`):
 *
 * @example
 * <CodeBlock language="sql" copyValue={QUERY}>
 *   {QUERY}
 * </CodeBlock>
 */
export function CodeBlock({
  className,
  language,
  copyValue,
  copyLabel,
  children,
  ref,
  ...props
}: CodeBlockProps) {
  const hasHeader = Boolean(language || copyValue);
  return (
    <figure
      ref={ref}
      data-slot="code-block"
      data-language={language || undefined}
      className={cn(
        "w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-muted text-foreground",
        className,
      )}
      {...props}
    >
      {hasHeader ? (
        <figcaption
          data-slot="code-block-header"
          className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5"
        >
          <span className="font-mono text-xs text-muted-foreground uppercase">
            {language ?? "code"}
          </span>
          {copyValue != null ? (
            <CopyButton
              value={copyValue}
              // `icon-xs`, not `xs`: since Batch 2 put `button.tsx` back on upstream the two are
              // different tiers — `xs` is `h-6 px-2 text-xs`, a TEXT button, and this control has
              // no label. The pre-reset Button had one ladder, which is why the plain `xs` was here.
              size="icon-xs"
              variant="ghost"
              copyLabel={copyLabel ?? `Copy ${language ?? "code"}`}
            />
          ) : null}
        </figcaption>
      ) : null}
      <pre data-slot="code-block-pre" className="overflow-x-auto p-4 text-sm">
        <code className="font-mono">{children}</code>
      </pre>
    </figure>
  );
}
