// @vegastack section-header@0.1.0 sha256-URrmpx4shfngDC1DkX6bbijKMzHtRO2N7cBBiUaNy6c=

// @vegastack section-header@0.1.0 — new component; run `pnpm run registry:build` to stamp
// integrity + regenerate the copy-in/JSON.

'use client';

import * as React from 'react';
import { cn } from '@vegastack/design';

const SECTION_HEADER_DISPLAY_SIZE = {
  sm: 'text-display-sm',
  md: 'text-display-md',
  lg: 'text-display-lg',
  xl: 'text-display-xl',
} as const;

export interface SectionHeaderProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'title'> {
  /**
   * Small mono uppercase label above the title (e.g. `"01 / Platform"`,
   * `"Now shipping"`). Rendered in the mono voice (`font-mono` +
   * `text-mono-label`, uppercase, `--alpha` tracking baked into the token) —
   * uppercase is mono-EXCLUSIVE, never apply it to the title/description.
   * A single `--brand` dot precedes it — the sanctioned "eyebrow highlight"
   * marker role (audit 17-brand-direction §Color & surface); the text itself
   * stays neutral `muted-foreground` so the accent stays a marker, not a wash.
   */
  eyebrow?: React.ReactNode;
  /**
   * The section headline. Rendered at the tokenized display scale
   * (`text-display-{size}`, tracking baked in). Compose a serif-italic
   * emphasis span for ONE word/phrase per header — never the whole
   * headline — e.g.
   * `<>Ship agentic UI, <em className="font-serif italic">fast</em>.</>`.
   * `font-serif` resolves to the Newsreader token (`--font-family-serif`);
   * reserve it for display emphasis + pull-quotes only (never running body
   * text) per audit 17.
   */
  title: React.ReactNode;
  /** Optional supporting copy under the title. */
  description?: React.ReactNode;
  /**
   * Display scale — `sm`(32) / `md`(40) / `lg`(56) / `xl`(72), the tokenized
   * `text-display-*` ladder (tracking baked in per step).
   * @default 'md'
   */
  size?: keyof typeof SECTION_HEADER_DISPLAY_SIZE;
  /**
   * Text + flex alignment.
   * @default 'start'
   */
  align?: 'start' | 'center';
}

/**
 * `SectionHeader` — the marketing section header: an optional mono uppercase
 * eyebrow (with a single `--brand` marker dot), a display-scale title, and an
 * optional description. Every size maps to a tokenized `text-display-*` step;
 * the eyebrow is the mono voice layer (`font-mono` + `text-mono-label`,
 * uppercase, 12px). Purely presentational — compose it inside a
 * `MarketingSurface` (or any surface) as the lead-in for a section.
 *
 * @example
 * <SectionHeader
 *   eyebrow="Platform"
 *   title={<>Built for <em className="font-serif italic">agentic</em> teams</>}
 *   description="Tokens, components, and a private registry — one system for humans and agents."
 * />
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  size = 'md',
  align = 'start',
  className,
  ref,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      ref={ref}
      data-slot="section-header"
      data-align={align}
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
      {...props}
    >
      {eyebrow ? (
        <p
          data-slot="section-header-eyebrow"
          className="flex items-center gap-2 font-mono text-mono-label text-muted-foreground uppercase"
        >
          <span
            aria-hidden="true"
            data-slot="section-header-eyebrow-mark"
            className="size-1.5 shrink-0 rounded-full bg-brand"
          />
          {eyebrow}
        </p>
      ) : null}
      <h2
        data-slot="section-header-title"
        className={cn(SECTION_HEADER_DISPLAY_SIZE[size], 'text-balance text-foreground')}
      >
        {title}
      </h2>
      {description ? (
        <p
          data-slot="section-header-description"
          className={cn(
            'max-w-2xl text-lg text-foreground/(--opacity-hint)',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
