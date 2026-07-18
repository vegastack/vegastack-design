// @vegastack terminal@0.1.0 sha256-5c0kuTNpz9kAJv/U4Sj9ymMi30lDZtbThX1g/hZKRJc=

// @vegastack terminal@0.1.0 — new component; run `pnpm run registry:build` to stamp integrity +
// regenerate the copy-in/JSON.

'use client';

import * as React from 'react';
import { cn } from '@vegastack/design';
// `CopyButton` is owned by the sibling CopyButton component; shadcn rewrites this alias on
// `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { CopyButton } from '@/components/ui/copy-button';

export interface TerminalLine {
  /** Command text, rendered after the prompt glyph. */
  command?: string;
  /** Non-command output/comment line — no prompt glyph, dimmed. */
  output?: string;
}

export interface TerminalProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'children' | 'title'> {
  /**
   * The lines to render, top to bottom. A plain string is shorthand for
   * `{ command: string }`. Content is fully caller-supplied (no timestamps,
   * no randomness) — deterministic by construction, so it's VRT-stable.
   */
  lines: (string | TerminalLine)[];
  /**
   * The prompt glyph shown before each command line — the sanctioned
   * "terminal prompt glyph" `--brand` marker role (audit 17-brand-direction
   * §Color & surface).
   * @default '$'
   */
  prompt?: string;
  /** Small mono uppercase label in the header bar. @default 'Terminal' */
  title?: React.ReactNode;
  /**
   * Value copied by the header `CopyButton`. Defaults to every `command`
   * line (not `output` lines) joined with newlines.
   */
  copyValue?: string;
}

function normalizeLine(line: string | TerminalLine): TerminalLine {
  return typeof line === 'string' ? { command: line } : line;
}

/**
 * `Terminal` (a.k.a. CommandBlock) — a dark mono command block: a header bar
 * (title + a composed {@link CopyButton}) over command/output lines, each
 * command prefixed with a `--brand` phosphor prompt glyph. Self-scopes to the
 * marketing dark ground (`.vs-marketing`) so it reads correctly even embedded
 * in a light-theme docs page (e.g. an install snippet) — no `MarketingSurface`
 * wrapper required, though nesting one is harmless (values are identical).
 *
 * @example
 * <Terminal
 *   title="Install"
 *   lines={[
 *     'pnpm dlx shadcn@latest add @vegastack/button',
 *     { output: '✓ Installed 1 component' },
 *   ]}
 * />
 */
export function Terminal({
  lines,
  prompt = '$',
  title = 'Terminal',
  copyValue,
  className,
  ref,
  ...props
}: TerminalProps) {
  const normalized = React.useMemo(() => lines.map(normalizeLine), [lines]);
  const defaultCopyValue = React.useMemo(
    () =>
      normalized
        .filter((line) => line.command !== undefined)
        .map((line) => line.command)
        .join('\n'),
    [normalized],
  );

  return (
    <div
      ref={ref}
      data-slot="terminal"
      className={cn('vs-marketing overflow-hidden rounded-(--radius-sharp) border border-border bg-card', className)}
      {...props}
    >
      <div
        data-slot="terminal-header"
        className="flex items-center justify-between gap-2 border-b border-border px-3 py-2"
      >
        <span className="font-mono text-mono-label text-muted-foreground uppercase">{title}</span>
        <CopyButton
          value={copyValue ?? defaultCopyValue}
          variant="ghost"
          size="icon-xs"
          copyLabel="Copy command"
          copiedLabel="Copied command"
        />
      </div>
      <div
        data-slot="terminal-body"
        // scroll-fade-x (the CSS-only edge-fade utility from @vegastack/design-tokens/utilities.css,
        // same family tabs' list uses) masks the clipped edge so a command cut mid-token on
        // narrow screens reads as "more this way" instead of a hard cut — the fade only
        // appears on the edge that actually has off-screen content (scroll-driven, zero JS).
        className="flex flex-col gap-1.5 overflow-x-auto scroll-fade-x px-4 py-3 font-mono text-code text-foreground"
      >
        {normalized.map((line, index) => (
          <div key={index} data-slot="terminal-line" className="flex gap-2 whitespace-pre">
            {line.command !== undefined ? (
              <>
                <span aria-hidden="true" data-slot="terminal-prompt" className="shrink-0 text-brand">
                  {prompt}
                </span>
                <span>{line.command}</span>
              </>
            ) : (
              <span className="text-foreground/(--opacity-hint-soft)">{line.output}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
