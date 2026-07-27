// @vegastack terminal@0.4.0 sha256-AUBfvQi9VrRia4XeS45u2xYDEvAqYwZQetldXrwvZQc=

import * as React from "react";
import { cn } from "@vegastack/design";
// `CopyButton` is owned by the sibling CopyButton component; shadcn rewrites this alias on
// `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { CopyButton } from "@/components/ui/copy-button";

export interface TerminalLine {
  /** Command text, rendered after the prompt glyph. */
  command?: string;
  /** Non-command output/comment line — no prompt glyph, dimmed. */
  output?: string;
}

/** Props accepted by `Terminal`. */
export interface TerminalProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children" | "title"
> {
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
   * Value copied by the trailing `CopyButton`. Defaults to every `command`
   * line (not `output` lines) joined with newlines.
   * @default derived from command lines
   */
  copyValue?: string;
  /**
   * Accessible name for the scrollable command pane, which is a keyboard
   * focus stop. Overrides the default, which names the pane from the visible
   * `title`. Mirrors `ScrollArea`: the label is intercepted here and applied to
   * the focusable element, not to the outer block.
   * @default derived from `title`
   */
  "aria-label"?: string;
  /**
   * Id of an element naming the scrollable command pane. Takes precedence over
   * the visible `title`; ignored when `aria-label` is set.
   * @default the visible title element
   */
  "aria-labelledby"?: string;
}

function normalizeLine(line: string | TerminalLine): TerminalLine {
  return typeof line === "string" ? { command: line } : line;
}

/**
 * `Terminal` (a.k.a. CommandBlock) — a dark mono command block: a title bar
 * over command/output lines, each command prefixed with a `--brand` phosphor
 * prompt glyph, plus a composed trailing {@link CopyButton}. The command pane
 * scrolls independently, so the copy action remains visible at the inline end —
 * which makes it a keyboard focus stop, named from the visible `title` and
 * exposed as a `group` (override with `aria-label`/`aria-labelledby`).
 * Self-scopes to the
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
  prompt = "$",
  title = "Terminal",
  copyValue,
  className,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: TerminalProps) {
  // `useId` is one of the few React hooks that resolves under the `react-server`
  // condition, so naming the pane costs this component nothing: it stays
  // server-safe with no `'use client'` directive.
  const titleId = React.useId();
  const normalized = lines.map(normalizeLine);
  const defaultCopyValue = normalized
    .filter((line) => line.command !== undefined)
    .map((line) => line.command)
    .join("\n");

  return (
    <div
      ref={ref}
      data-slot="terminal"
      className={cn(
        "vs-marketing overflow-hidden rounded-(--radius-sharp) border border-border bg-card",
        className,
      )}
      {...props}
    >
      <div
        data-slot="terminal-header"
        className="flex items-center border-b border-border px-3 py-2"
      >
        <span
          id={titleId}
          className="font-mono text-mono-label text-muted-foreground uppercase"
        >
          {title}
        </span>
      </div>
      <div
        data-slot="terminal-command-row"
        className="grid grid-cols-[minmax(0,1fr)_auto]"
      >
        <div
          data-slot="terminal-body"
          tabIndex={0}
          // The pane is a keyboard focus stop (a scrollable region must be reachable without a
          // pointer), so it needs a name and a role that can carry one. A bare `<div tabindex="0">`
          // maps to `generic`, which PROHIBITS naming — `aria-label` on it is not reliably exposed,
          // and the pane announces as an unnamed stop. `group` is the right weight: it accepts a
          // name and is not a landmark. `region` would be, and a docs page with five install
          // snippets would put five landmarks in the rotor for no navigational value.
          role="group"
          // Free correct name from the visible title, overridable in the usual precedence order.
          // Never emit both: `aria-labelledby` wins in the AT, so a caller passing `aria-label`
          // would otherwise be silently ignored.
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : (ariaLabelledBy ?? titleId)}
          // scroll-fade-x (the CSS-only edge-fade utility from @vegastack/design-tokens/utilities.css,
          // same family tabs' list uses) masks the clipped edge so a command cut mid-token on
          // narrow screens reads as "more this way" instead of a hard cut — the fade only
          // appears on the edge that actually has off-screen content (scroll-driven, zero JS).
          //
          // The focus affordance is the shared `:focus-visible` outline, pulled INSIDE the box with
          // a negative offset. Two things clip an outward outline here: the terminal root is
          // `overflow-hidden`, and `scroll-fade-x` masks this element to its own border box — an
          // outline drawn outside that box is not painted at all. A border tint is not an option
          // either: `forced-colors: active` replaces border-color outright, which left this
          // scrollable region with no focus indicator whatsoever in the forced palette.
          className="flex min-w-0 flex-col gap-1.5 overflow-x-auto scroll-fade-x px-4 py-3 font-mono text-code text-foreground focus-visible:-outline-offset-2"
        >
          {normalized.map((line, index) => (
            <div
              key={index}
              data-slot="terminal-line"
              className="flex gap-2 whitespace-pre"
            >
              {line.command !== undefined ? (
                <>
                  <span
                    aria-hidden="true"
                    data-slot="terminal-prompt"
                    className="shrink-0 text-brand"
                  >
                    {prompt}
                  </span>
                  <span>{line.command}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{line.output}</span>
              )}
            </div>
          ))}
        </div>
        <div
          data-slot="terminal-copy"
          className="flex shrink-0 items-center border-s border-border px-1"
        >
          <CopyButton
            value={copyValue ?? defaultCopyValue}
            copyLabel="Copy command"
            copiedLabel="Copied command"
            className="text-foreground data-[copied]:text-primary data-[copied]:hover:text-primary"
          />
        </div>
      </div>
    </div>
  );
}
